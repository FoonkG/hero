import Log from '@ulixee/commons/lib/Logger';
import SqliteTable from '@ulixee/commons/lib/SqliteTable';
import * as Database from 'better-sqlite3';
import { Database as SqliteDatabase, Transaction } from 'better-sqlite3';
import env from '../env';
import AwaitedEventsTable from '../models/AwaitedEventsTable';
import CommandsTable from '../models/CommandsTable';
import DetachedElementsTable from '../models/DetachedElementsTable';
import DetachedResourcesTable from '../models/DetachedResourcesTable';
import DevtoolsMessagesTable from '../models/DevtoolsMessagesTable';
import DomChangesTable from '../models/DomChangesTable';
import FlowCommandsTable from '../models/FlowCommandsTable';
import FlowHandlersTable from '../models/FlowHandlersTable';
import FocusEventsTable from '../models/FocusEventsTable';
import FrameNavigationsTable from '../models/FrameNavigationsTable';
import FramesTable from '../models/FramesTable';
import InteractionStepsTable from '../models/InteractionStepsTable';
import MouseEventsTable from '../models/MouseEventsTable';
import OutputTable from '../models/OutputTable';
import PageLogsTable from '../models/PageLogsTable';
import ResourcesTable from '../models/ResourcesTable';
import ResourceStatesTable from '../models/ResourceStatesTable';
import ScreenshotsTable from '../models/ScreenshotsTable';
import ScrollEventsTable from '../models/ScrollEventsTable';
import SessionLogsTable from '../models/SessionLogsTable';
import SessionTable from '../models/SessionTable';
import SnippetsTable from '../models/SnippetsTable';
import SocketsTable from '../models/SocketsTable';
import StorageChangesTable from '../models/StorageChangesTable';
import TabsTable from '../models/TabsTable';
import WebsocketMessagesTable from '../models/WebsocketMessagesTable';

const { log } = Log(module);

interface IDbOptions {
  readonly?: boolean;
  fileMustExist?: boolean;
}

export default class SessionDb {
  public get readonly(): boolean {
    return this.db?.readonly;
  }

  public get isOpen(): boolean {
    return this.db?.open;
  }

  public readonly path: string;

  public readonly commands: CommandsTable;
  public readonly frames: FramesTable;
  public readonly frameNavigations: FrameNavigationsTable;
  public readonly sockets: SocketsTable;
  public readonly resources: ResourcesTable;
  public readonly resourceStates: ResourceStatesTable;
  public readonly websocketMessages: WebsocketMessagesTable;
  public readonly domChanges: DomChangesTable;
  public readonly detachedElements: DetachedElementsTable;
  public readonly detachedResources: DetachedResourcesTable;
  public readonly snippets: SnippetsTable;
  public readonly interactions: InteractionStepsTable;
  public readonly flowHandlers: FlowHandlersTable;
  public readonly flowCommands: FlowCommandsTable;
  public readonly pageLogs: PageLogsTable;
  public readonly sessionLogs: SessionLogsTable;
  public readonly session: SessionTable;
  public readonly mouseEvents: MouseEventsTable;
  public readonly focusEvents: FocusEventsTable;
  public readonly scrollEvents: ScrollEventsTable;
  public readonly storageChanges: StorageChangesTable;
  public readonly screenshots: ScreenshotsTable;
  public readonly devtoolsMessages: DevtoolsMessagesTable;
  public readonly awaitedEvents: AwaitedEventsTable;
  public readonly tabs: TabsTable;
  public readonly output: OutputTable;
  public readonly sessionId: string;

  public keepAlive = false;

  private readonly batchInsert?: Transaction;
  private readonly saveInterval: NodeJS.Timeout;

  private db: SqliteDatabase;
  private readonly tables: SqliteTable<any>[] = [];

  constructor(sessionId: string, path: string, dbOptions: IDbOptions = {}) {
    const { readonly = false, fileMustExist = false } = dbOptions;
    this.sessionId = sessionId;
    this.path = path;
    this.db = new Database(this.path, { readonly, fileMustExist });
    if (env.enableSqliteWal && !dbOptions.readonly) {
      this.db.unsafeMode(false);
      this.db.pragma('journal_mode = WAL');
    }
    if (!readonly) {
      this.saveInterval = setInterval(this.flush.bind(this), 5e3).unref();
    }

    this.commands = new CommandsTable(this.db);
    this.tabs = new TabsTable(this.db);
    this.frames = new FramesTable(this.db);
    this.frameNavigations = new FrameNavigationsTable(this.db);
    this.sockets = new SocketsTable(this.db);
    this.resources = new ResourcesTable(this.db);
    this.resourceStates = new ResourceStatesTable(this.db);
    this.websocketMessages = new WebsocketMessagesTable(this.db);
    this.domChanges = new DomChangesTable(this.db);
    this.detachedElements = new DetachedElementsTable(this.db);
    this.detachedResources = new DetachedResourcesTable(this.db);
    this.snippets = new SnippetsTable(this.db);
    this.flowHandlers = new FlowHandlersTable(this.db);
    this.flowCommands = new FlowCommandsTable(this.db);
    this.pageLogs = new PageLogsTable(this.db);
    this.session = new SessionTable(this.db);
    this.interactions = new InteractionStepsTable(this.db);
    this.mouseEvents = new MouseEventsTable(this.db);
    this.focusEvents = new FocusEventsTable(this.db);
    this.scrollEvents = new ScrollEventsTable(this.db);
    this.sessionLogs = new SessionLogsTable(this.db);
    this.screenshots = new ScreenshotsTable(this.db);
    this.storageChanges = new StorageChangesTable(this.db);
    this.devtoolsMessages = new DevtoolsMessagesTable(this.db);
    this.awaitedEvents = new AwaitedEventsTable(this.db);
    this.output = new OutputTable(this.db);

    this.tables.push(
      this.commands,
      this.tabs,
      this.frames,
      this.frameNavigations,
      this.sockets,
      this.resources,
      this.resourceStates,
      this.websocketMessages,
      this.domChanges,
      this.detachedElements,
      this.detachedResources,
      this.snippets,
      this.flowHandlers,
      this.flowCommands,
      this.pageLogs,
      this.session,
      this.interactions,
      this.mouseEvents,
      this.focusEvents,
      this.scrollEvents,
      this.sessionLogs,
      this.devtoolsMessages,
      this.screenshots,
      this.storageChanges,
      this.awaitedEvents,
      this.output,
    );

    if (!readonly) {
      this.batchInsert = this.db.transaction(() => {
        for (const table of this.tables) {
          try {
            table.runPendingInserts();
          } catch (error) {
            if (String(error).match('attempt to write a readonly database')) {
              clearInterval(this.saveInterval);
              this.db = null;
            }
            log.error('SessionDb.flushError', {
              sessionId: this.sessionId,
              error: String(error),
              table: table.tableName,
            });
          }
        }
      });
    }
  }

  public getCollectedAssetNames(): { resources: string[]; elements: string[]; snippets: string[] } {
    const snippets = new Set<string>();
    for (const snippet of this.snippets.all()) {
      snippets.add(snippet.name);
    }
    const resources = new Set<string>();
    for (const resource of this.detachedResources.all()) {
      resources.add(resource.name);
    }

    const elementNames = this.detachedElements.allNames();

    return {
      snippets: [...snippets],
      resources: [...resources],
      elements: [...elementNames],
    };
  }

  public close(): void {
    clearInterval(this.saveInterval);

    if (this.db?.open) {
      this.flush();
    }

    if (this.keepAlive) {
      this.db.readonly = true;
      return;
    }

    if (env.enableSqliteWal && !this.db.readonly) {
      this.db.pragma('journal_mode = DELETE');
    }
    this.db.close();
    this.db = null;
  }

  public flush(): void {
    if (this.batchInsert) {
      try {
        this.batchInsert.immediate();
      } catch (error) {
        if (
          String(error).match(/attempt to write a readonly database/) ||
          String(error).match(/database is locked/)
        ) {
          clearInterval(this.saveInterval);
        }
        throw error;
      }
    }
  }
}
