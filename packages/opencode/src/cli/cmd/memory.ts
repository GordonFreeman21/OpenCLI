import type { CommandModule } from "yargs"
import { EOL } from "os"
import { ContextMemory } from "../../features/memory"

export const MemoryCommand: CommandModule = {
  command: "memory",
  describe: "Manage persistent context memory",
  builder: (yargs) =>
    yargs
      .command("set <key> <value>", "Remember a key-value pair", (y) =>
        y
          .positional("key", { type: "string", demandOption: true })
          .positional("value", { type: "string", demandOption: true })
          .option("category", {
            describe: "Category",
            type: "string",
            choices: ["preference", "fact", "context", "note"],
            default: "note",
          }),
      )
      .command("get <key>", "Recall a memory", (y) =>
        y.positional("key", { type: "string", demandOption: true }),
      )
      .command("search <query>", "Search memories", (y) =>
        y.positional("query", { type: "string", demandOption: true }),
      )
      .command("list", "List all memories")
      .command("forget <key>", "Forget a memory", (y) =>
        y.positional("key", { type: "string", demandOption: true }),
      )
      .command("clear", "Clear all memories")
      .demandCommand(1),
  handler: async () => {},
}
