import { useInput } from "ra-core";

/** A minimal color picker input compatible with ra-core's useInput. */
export const ColorInput = ({ source }: { source: string }) => {
  const { field } = useInput({ source });
  return (
    <input
      type="color"
      {...field}
      value={field.value || "#000000"}
      className="w-9 h-9 shrink-0 cursor-pointer appearance-none rounded border bg-transparent p-0.5 [&::-webkit-color-swatch-wrapper]:cursor-pointer [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:cursor-pointer [&::-webkit-color-swatch]:rounded-sm [&::-webkit-color-swatch]:border-none [&::-moz-color-swatch]:cursor-pointer [&::-moz-color-swatch]:rounded-sm [&::-moz-color-swatch]:border-none"
    />
  );
};
