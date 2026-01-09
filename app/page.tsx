import fs from "node:fs";
import path from "node:path";

import Reader from "./reader";

export default function Home() {
  const bookPath = path.join(process.cwd(), "public", "book.txt");
  const text = fs.readFileSync(bookPath, "utf8");

  return <Reader text={text} />;
}
