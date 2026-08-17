# Imagen de Kontrolia CRM.
#
# Compilacion en varias etapas para que la imagen final no arrastre ni el
# codigo fuente ni las dependencias de desarrollo.

FROM node:22-alpine AS dependencias
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-alpine AS compilacion
WORKDIR /app
COPY --from=dependencias /app/node_modules ./node_modules
COPY . .
# Las variables NEXT_PUBLIC_ se incrustan al compilar, asi que deben estar
# disponibles en esta etapa. Se pasan con --build-arg o con un archivo de
# entorno montado.
RUN npm run build

FROM node:22-alpine AS ejecucion
WORKDIR /app
ENV NODE_ENV=production
# Usuario sin privilegios: el proceso no necesita ser root.
RUN addgroup -S kontrolia && adduser -S kontrolia -G kontrolia
COPY --from=compilacion --chown=kontrolia:kontrolia /app/.next ./.next
COPY --from=compilacion --chown=kontrolia:kontrolia /app/public ./public
COPY --from=compilacion --chown=kontrolia:kontrolia /app/node_modules ./node_modules
COPY --from=compilacion --chown=kontrolia:kontrolia /app/package.json ./package.json
USER kontrolia
EXPOSE 3001
CMD ["npm", "run", "start"]
