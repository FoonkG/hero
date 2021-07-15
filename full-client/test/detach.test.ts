import { Helpers } from '@secret-agent/testing';
import { ITestKoaServer } from '@secret-agent/testing/helpers';
import { Handler } from '../index';

let koaServer: ITestKoaServer;
let handler: Handler;
beforeAll(async () => {
  handler = new Handler();
  Helpers.onClose(() => handler.close(), true);
  koaServer = await Helpers.runKoaServer();
});
afterAll(Helpers.afterAll);
afterEach(Helpers.afterEach);

describe('basic Detach tests', () => {
  it('can detach a document', async () => {
    koaServer.get('/detach-1', ctx => {
      ctx.body = `
        <body>
          <a href="#page1">Click Me</a>
        </body>
      `;
    });
    const agent = await openBrowser(`/detach-1`);
    const links = await agent.document.querySelectorAll('a').length;
    expect(links).toBe(1);

    const frozenTab = await agent.detach(agent.activeTab);
    const detachedTab = await frozenTab.document.querySelectorAll('a').length;
    expect(detachedTab).toBe(1);
  });

  it('should keep the original tab detached', async () => {
    koaServer.get('/detach-grow', ctx => {
      ctx.body = `
        <body>
          <a href="javascript:void(0);" onclick="clicker()">Click Me</a>

          <script>
          function clicker() {
            const elem = document.createElement('A');
            document.querySelector('a').after(elem)
          }
          </script>
        </body>
      `;
    });
    const agent = await openBrowser(`/detach-grow`);
    const links = await agent.document.querySelectorAll('a').length;
    expect(links).toBe(1);

    const frozenTab = await agent.detach(agent.activeTab);
    const detachedTab = await frozenTab.document.querySelectorAll('a').length;
    expect(detachedTab).toBe(1);

    await agent.click(agent.document.querySelector('a'));
    const linksAfterClick = await agent.document.querySelectorAll('a').length;
    expect(linksAfterClick).toBe(2);

    const detachedLinksAfterClick = await frozenTab.document.querySelectorAll('a').length;
    expect(detachedLinksAfterClick).toBe(1);

    const frozenTab2 = await agent.detach(agent.activeTab);
    const detachedTab2 = await frozenTab2.document.querySelectorAll('a').length;
    expect(detachedTab2).toBe(2);
  });
});

async function openBrowser(path: string) {
  const agent = await handler.createAgent();
  Helpers.needsClosing.push(agent);
  await agent.goto(`${koaServer.baseUrl}${path}`);
  await agent.waitForPaintingStable();
  return agent;
}
