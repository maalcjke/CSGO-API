import fs from "fs";
import path from "path";
import { getLanguages, parseLanguagesArg } from "../utils/languages.js";

const args = process.argv.slice(2);
const codes = parseLanguagesArg(args);

if (codes.length === 0) {
    console.error("Error: no languages specified. Pass --languages en,ru,de (comma-separated folder codes).");
    process.exit(1);
}

const languages = getLanguages(codes);

if (languages.length === 0) {
    console.error(`Error: none of the provided codes match known languages: ${codes.join(", ")}`);
    process.exit(1);
}

const englishFile = path.join(process.cwd(), "public/api/en/skins_not_grouped.json");

if (!fs.existsSync(englishFile)) {
    console.error(
        "Error: public/api/en/skins_not_grouped.json is required because market_hash_name is always English. Include 'en' in --languages when generating data."
    );
    process.exit(1);
}

const englishSkins = JSON.parse(fs.readFileSync(englishFile, "utf-8"));
const englishById = new Map(englishSkins.map(item => [item.id, item]));
const mappings = {};

for (const { folder } of languages) {
    const localizedFile = path.join(process.cwd(), `public/api/${folder}/skins_not_grouped.json`);

    if (!fs.existsSync(localizedFile)) {
        console.warn(`Skipping '${folder}': ${localizedFile} does not exist.`);
        continue;
    }

    const localizedSkins = JSON.parse(fs.readFileSync(localizedFile, "utf-8"));
    const localizedById = new Map(localizedSkins.map(item => [item.id, item]));
    const languageMap = {};

    for (const [id, englishItem] of englishById) {
        if (!englishItem.market_hash_name) continue;

        const localizedItem = localizedById.get(id);
        languageMap[englishItem.market_hash_name] = localizedItem?.name ?? englishItem.name;
    }

    mappings[folder] = languageMap;
    console.log(`Mapped ${Object.keys(languageMap).length} names for '${folder}'.`);
}

const outputFile = path.join(process.cwd(), "public/api/market_hash_name_map.json");
fs.writeFileSync(outputFile, JSON.stringify(mappings));

console.log(`Market hash name mapping generated at ${outputFile}.`);
