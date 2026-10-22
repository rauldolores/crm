import { X } from "lucide-react";
import { useListContext, useTranslate } from "ra-core";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

import { useConfigurationContext } from "../root/ConfigurationContext";
import type { CustomFieldDefinition } from "../types";
import {
  campoFiltrado,
  claveDeEstado,
  ESTADOS_DE_MEXICO,
  filtroDeCampo,
  sinFiltroDeCampo,
  type PrefijoDeEmpresa,
} from "./consultaDeEmpresa";

/** Valor del Select que significa «sin filtro» (Radix no admite ""). */
const TODOS = "__todos";

/** Estado de la república de la empresa. Ver consultaDeEmpresa.ts. */
export const FiltroDeEstado = ({
  prefijo,
  className,
}: {
  prefijo: PrefijoDeEmpresa;
  className?: string;
}) => {
  const translate = useTranslate();
  const { filterValues, setFilters } = useListContext();
  const clave = claveDeEstado(prefijo);
  const actual = (filterValues?.[clave] as string | undefined) ?? TODOS;

  return (
    <Select
      value={actual}
      onValueChange={(estado) => {
        const { [clave]: _anterior, ...resto } = filterValues ?? {};
        setFilters(estado === TODOS ? resto : { ...resto, [clave]: estado });
      }}
    >
      <SelectTrigger
        className={cn("w-full", className)}
        aria-label={translate("crm.filters.company.state")}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={TODOS}>
          {translate("crm.filters.company.all_states")}
        </SelectItem>
        {ESTADOS_DE_MEXICO.map((estado) => (
          <SelectItem key={estado} value={estado}>
            {estado}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

/**
 * Un campo personalizado de la empresa y su valor. El control del valor
 * cambia con el tipo del campo: lista y casilla se eligen, texto se busca
 * por contenido, número es un mínimo y fecha es un día exacto.
 */
export const FiltroDeCampoPersonalizado = ({
  prefijo,
  className,
}: {
  prefijo: PrefijoDeEmpresa;
  className?: string;
}) => {
  const translate = useTranslate();
  const { companyCustomFields } = useConfigurationContext();
  const { filterValues, setFilters } = useListContext();
  const filtrado = campoFiltrado(filterValues ?? {}, prefijo);
  const [elegido, setElegido] = useState(filtrado?.campo ?? "");
  const campo = companyCustomFields.find(
    (candidato) => candidato.value === elegido,
  );

  if (!companyCustomFields.length) return null;

  const aplicar = (definicion: CustomFieldDefinition, valor: string) =>
    setFilters({
      ...sinFiltroDeCampo(filterValues ?? {}, prefijo),
      ...filtroDeCampo(prefijo, definicion, valor),
    });

  const limpiar = () => {
    setElegido("");
    setFilters(sinFiltroDeCampo(filterValues ?? {}, prefijo));
  };

  return (
    <div className={cn("flex flex-col gap-2 w-full", className)}>
      <div className="flex gap-1 w-full">
        <Select
          value={elegido || TODOS}
          onValueChange={(valor) => {
            if (valor === TODOS) return limpiar();
            setElegido(valor);
            setFilters(sinFiltroDeCampo(filterValues ?? {}, prefijo));
          }}
        >
          <SelectTrigger
            className="w-full min-w-0"
            aria-label={translate("crm.filters.company.custom_field")}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={TODOS}>
              {translate("crm.filters.company.any_field")}
            </SelectItem>
            {companyCustomFields.map((definicion) => (
              <SelectItem key={definicion.value} value={definicion.value}>
                {definicion.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {elegido && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={limpiar}
            aria-label={translate("crm.filters.company.clear")}
          >
            <X />
          </Button>
        )}
      </div>
      {campo && (
        <ValorDeCampo
          key={campo.value}
          campo={campo}
          inicial={filtrado?.campo === campo.value ? filtrado.valor : ""}
          onCambio={(valor) => aplicar(campo, valor)}
        />
      )}
    </div>
  );
};

const ValorDeCampo = ({
  campo,
  inicial,
  onCambio,
}: {
  campo: CustomFieldDefinition;
  inicial: string;
  onCambio: (valor: string) => void;
}) => {
  const translate = useTranslate();

  if (campo.type === "list" || campo.type === "checkbox") {
    const opciones =
      campo.type === "list"
        ? (campo.options ?? []).map((opcion) => ({
            id: opcion,
            nombre: opcion,
          }))
        : [
            { id: "true", nombre: translate("crm.filters.company.yes") },
            { id: "false", nombre: translate("crm.filters.company.no") },
          ];
    return (
      <Select
        value={inicial || TODOS}
        onValueChange={(valor) => onCambio(valor === TODOS ? "" : valor)}
      >
        <SelectTrigger className="w-full" aria-label={campo.label}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={TODOS}>
            {translate("crm.filters.company.any_value")}
          </SelectItem>
          {opciones.map((opcion) => (
            <SelectItem key={opcion.id} value={opcion.id}>
              {opcion.nombre}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  return (
    <TextoConEspera
      tipo={
        campo.type === "number"
          ? "number"
          : campo.type === "date"
            ? "date"
            : "text"
      }
      inicial={inicial}
      placeholder={translate(
        campo.type === "number"
          ? "crm.filters.company.minimum"
          : "crm.filters.company.contains",
      )}
      etiqueta={campo.label}
      onCambio={onCambio}
    />
  );
};

/** Aplica el valor medio segundo después de dejar de escribir. */
const TextoConEspera = ({
  tipo,
  inicial,
  placeholder,
  etiqueta,
  onCambio,
}: {
  tipo: "text" | "number" | "date";
  inicial: string;
  placeholder: string;
  etiqueta: string;
  onCambio: (valor: string) => void;
}) => {
  const [valor, setValor] = useState(inicial);

  useEffect(() => {
    if (valor === inicial) return;
    const espera = setTimeout(() => onCambio(valor), 500);
    return () => clearTimeout(espera);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [valor]);

  return (
    <Input
      type={tipo}
      value={valor}
      placeholder={placeholder}
      aria-label={etiqueta}
      onChange={(evento) => setValor(evento.target.value)}
    />
  );
};
