
export default function Badge({children, color="slate"}:{children: React.ReactNode, color?: "slate"|"green"|"yellow"|"red"|"pink"|"blue"}){
  const styles: Record<string,string> = {
    slate:"bg-slate-100 text-slate-700",
    green:"bg-green-100 text-green-700",
    yellow:"bg-yellow-100 text-yellow-700",
    red:"bg-red-100 text-red-700",
    pink:"bg-pink-100 text-pink-700",
    blue:"bg-blue-100 text-blue-700",
  };
  return <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${styles[color]}`}>{children}</span>;
}
