import cac from 'cac';
import pc from 'picocolors';
import { runDevCommand, runBuildCommand, runPreviewCommand } from './commands/run.js';

const cli = cac('levelo');

cli
  .command('dev', 'Start development runtime for specified platform')
  .option('-p, --platform <platform>', 'Target platform (web | windows | android)', {
    default: 'web',
  })
  .option('--port <port>', 'Web dev server port', {
    default: 6262,
  })
  .action(async (options) => {
    try {
      await runDevCommand(options);
    } catch (err: any) {
      console.error(pc.red(`\n[Levelo CLI Error]: ${err.message}\n`));
      process.exit(1);
    }
  });

cli
  .command('build', 'Build standalone bundle for specified platform')
  .option('-p, --platform <platform>', 'Target platform (web | windows)', {
    default: 'web',
  })
  .action(async (options) => {
    try {
      await runBuildCommand(options);
    } catch (err: any) {
      console.error(pc.red(`\n[Levelo CLI Error]: ${err.message}\n`));
      process.exit(1);
    }
  });

cli
  .command('preview', 'Preview production web build locally')
  .option('--port <port>', 'Preview server port')
  .action(async (options) => {
    try {
      await runPreviewCommand(options);
    } catch (err: any) {
      console.error(pc.red(`\n[Levelo CLI Error]: ${err.message}\n`));
      process.exit(1);
    }
  });

cli.help();
cli.version('0.1.0');
cli.parse();
