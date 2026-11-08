import cac from "cac";
import pc from "picocolors"
import { runCommand } from "./commands/run.js";

const cli = cac("levelo");

cli
    .command("run", "Run LeveloJS application on target device")
    .option("-d, --device <device>", "Target platform (web | windows | android)", {
        default: "web"
    })
    .option("-p, --port <port>", "Web dev server port", {
        default: 6262,
    })
    .action(async (options) => {
        try {
            await runCommand(options)
        } catch (err: any) {
            console.error(pc.red(`\n[Levelo CLI Error]: ${err.message}\n`));
            process.exit(1);
        }
    });

cli.help();
cli.version("0.1.0");
cli.parse();