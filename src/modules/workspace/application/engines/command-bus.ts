import type { WorkspaceRegistry } from "../registry/workspace-registry";
import type { CommandManifest } from "../../domain/entities/command-manifest";
import type { PlatformEventBus } from "../../../../platform/events";
import { WORKSPACE_EVENT_TYPES } from "../../domain/events/workspace-events";

export class CommandRegistry {
  private customCommands = new Map<string, CommandManifest>();

  constructor(private workspaceRegistry: WorkspaceRegistry) {}

  public registerCommand(command: CommandManifest): void {
    this.customCommands.set(command.id, command);
  }

  public async getAllAvailableCommands(context: Record<string, unknown>): Promise<CommandManifest[]> {
    const providers = this.workspaceRegistry.getCommandProviders();
    const result: CommandManifest[] = Array.from(this.customCommands.values());

    for (const provider of providers) {
      if (provider.isEnabled(context)) {
        try {
          const cmds = await provider.getCommands(context);
          result.push(...cmds);
        } catch (err) {
          console.error(`[CommandRegistry] Error fetching commands from ${provider.id}:`, err);
        }
      }
    }

    return result;
  }

  public async findById(id: string, context: Record<string, unknown>): Promise<CommandManifest | undefined> {
    const all = await this.getAllAvailableCommands(context);
    return all.find((c) => c.id === id);
  }
}

export class IntentResolver {
  constructor(private commandRegistry: CommandRegistry) {}

  public async resolve(query: string, context: Record<string, unknown>): Promise<CommandManifest[]> {
    const allCommands = await this.commandRegistry.getAllAvailableCommands(context);
    const q = query.toLowerCase().trim();
    if (!q) return allCommands;

    return allCommands.filter(
      (cmd) =>
        cmd.name.toLowerCase().includes(q) ||
        (cmd.description && cmd.description.toLowerCase().includes(q)) ||
        cmd.category.toLowerCase().includes(q) ||
        (cmd.shortcut && cmd.shortcut.toLowerCase().includes(q))
    );
  }
}

export class CommandBus {
  private commandRegistry: CommandRegistry;
  private intentResolver: IntentResolver;

  constructor(
    workspaceRegistry: WorkspaceRegistry,
    private eventBus: PlatformEventBus
  ) {
    this.commandRegistry = new CommandRegistry(workspaceRegistry);
    this.intentResolver = new IntentResolver(this.commandRegistry);
  }

  public getRegistry(): CommandRegistry {
    return this.commandRegistry;
  }

  public getIntentResolver(): IntentResolver {
    return this.intentResolver;
  }

  public async execute(commandId: string, args?: Record<string, unknown>, context: Record<string, unknown> = {}): Promise<unknown> {
    const command = await this.commandRegistry.findById(commandId, context);
    if (!command) {
      throw new Error(`[CommandBus] Command '${commandId}' not found or not available in current context.`);
    }

    try {
      const result = await command.handler(args);
      this.eventBus.publish(WORKSPACE_EVENT_TYPES.COMMAND_EXECUTED, {
        commandId,
        category: command.category,
        success: true,
      });
      return result;
    } catch (err) {
      this.eventBus.publish(WORKSPACE_EVENT_TYPES.COMMAND_EXECUTED, {
        commandId,
        category: command.category,
        success: false,
        error: String(err),
      });
      throw err;
    }
  }
}
