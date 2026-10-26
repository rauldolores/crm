const MobileHeader = ({ children }: { children: React.ReactNode }) => {
  return (
    // Vino, como el encabezado de página en escritorio. `dark` cambia los
    // tokens solo aquí: títulos y botones fantasma se leen en blanco.
    <header className="dark fixed top-[var(--kontrolia-band-height,0px)] left-0 right-0 z-10 bg-hero text-foreground shadow-hero h-14 px-4 w-full flex justify-between items-center">
      {children}
    </header>
  );
};

export default MobileHeader;
