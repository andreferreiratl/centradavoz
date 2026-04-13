import { Link } from "react-router-dom";

export default function Logo({ size = "default" }) {
  const isSmall = size === "sm";
  return (
    <Link to="/" className="flex items-center select-none">
      <img
        src="https://media.base44.com/images/public/69da50375cc9660ed0fab63a/c9d2e48da_file_000000009a48720eaaa61bf4a204e45c.png"
        alt="Central da Voz" className="mx-3 my-1 pr-4 pl-6 h-16 w-auto object-contain" />

      
    </Link>);

}