/**
 * La marca en la barra lateral: el símbolo y el wordmark como en el diseño
 * de Claude Design — «vinqulia» en Manrope 800 con la «u» en carmesí y
 * «by Kontrolia» debajo, igual que «aduaniax» en AduaniaX.
 *
 * Si la organización cambió el título (Ajustes), se respeta: se pinta su
 * título sin la «u» de color ni la leyenda, que son de Vinqulia.
 */
export const MarcaVinqulia = ({
  logo,
  titulo,
}: {
  logo: string;
  titulo: string;
}) => {
  const esVinqulia = titulo.trim().toLowerCase() === "vinqulia";
  return (
    <div className="flex items-center gap-3">
      <img src={logo} alt="" className="size-9 shrink-0 rounded-[10px]" />
      <div className="min-w-0 leading-none">
        <p className="font-wordmark truncate text-[19px] leading-none font-extrabold tracking-[-0.01em] text-sidebar-strong">
          {esVinqulia ? (
            <>
              vinq<span className="text-primary">u</span>lia
            </>
          ) : (
            titulo
          )}
        </p>
        {esVinqulia && (
          <p className="mt-1 text-[8px] font-bold tracking-[0.2em] text-sidebar-label uppercase">
            by Kontrolia
          </p>
        )}
      </div>
    </div>
  );
};
