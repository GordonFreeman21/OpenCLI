import type { CommandModule } from "yargs"
import { EOL } from "os"
import { SmartSearch } from "../../features/smart-search"

export const SearchCommand: CommandModule = {
  command: "search <query>",
  describe: "Smart code search with fuzzy matching and ranking",
  builder: (yargs) =>
    yargs
      .positional("query", {
        describe: "Search query",
        type: "string",
        demandOption: true,
      })
      .option("dir", {
        describe: "Directory to search",
        type: "string",
        default: process.cwd(),
        alias: "d",
      })
      .option("fuzzy", {
        describe: "Enable fuzzy matching",
        type: "boolean",
        alias: "f",
        default: false,
      })
      .option("limit", {
        describe: "Max results",
        type: "number",
        alias: "n",
        default: 20,
      }),
  handler: async (opts) => {
    const results = await SmartSearch.search(opts.query as string, opts.dir as string, {
      limit: opts.limit as number,
      fuzzy: opts.fuzzy as boolean,
    })
    process.stderr.write(SmartSearch.format(results, opts.query as string) + EOL)
  },
}
