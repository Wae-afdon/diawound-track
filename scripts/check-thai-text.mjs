import { readFileSync } from "node:fs";
import { relative } from "node:path";

const files = [
  "src/i18n/translations.ts",
  "src/App.tsx",
  "src/data/mockData.ts",
  "src/types.ts",
];

const suspiciousSequences = [
  /\u0080|\u0081|\u0082|\u0083|\u0084|\u0085|\u0086|\u0087|\u0088|\u0089|\u008a|\u008b|\u008c|\u008d|\u008e|\u008f/,
  /\u0090|\u0091|\u0092|\u0093|\u0094|\u0095|\u0096|\u0097|\u0098|\u0099|\u009a|\u009b|\u009c|\u009d|\u009e|\u009f/,
  /\u0e40\u0e18.{0,8}\u0e40\u0e18/,
  /\u0e40\u0e19[\u0080-\u009f\u20ac]/,
];

let found = 0;

for (const file of files) {
  let content;
  try {
    content = readFileSync(file, "utf8");
  } catch {
    continue;
  }

  content.split(/\r?\n/).forEach((line, index) => {
    if (suspiciousSequences.some((pattern) => pattern.test(line))) {
      found += 1;
      console.log(`${relative(process.cwd(), file)}:${index + 1}: ${line.trim()}`);
    }
  });
}

if (found === 0) {
  console.log("No suspicious Thai mojibake markers found.");
} else {
  console.log(`Found ${found} suspicious Thai text line(s). Review manually.`);
}
