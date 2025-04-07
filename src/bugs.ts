import { BugsContainer } from '$/bootstrap/container';

const container = new BugsContainer();
const application = container.get('application');
process.exitCode = await application.run(process.argv);
