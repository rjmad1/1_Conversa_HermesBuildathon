import { describe, it, expect } from "vitest";
import { SchemaInheritanceFlattener } from "../../src/modules/metadata/domain/inheritance";
import { RegistryService } from "../../src/modules/metadata/domain/registry";
import { ValidationEngine } from "../../src/modules/metadata/services/validation-engine";
import { MetadataAppService } from "../../src/modules/metadata/application/service";
import type {
  ObjectTypeDefinition,
  FieldDefinition,
} from "../../src/modules/metadata/domain/types";
import type {
  IObjectTypeRepository,
  IFieldDefinitionRepository,
} from "../../src/modules/metadata/domain/ports";

class InMemoryObjectTypeRepo implements IObjectTypeRepository {
  private types = new Map<string, ObjectTypeDefinition>();
  async save(objectType: ObjectTypeDefinition) {
    this.types.set(objectType.id, objectType);
  }
  async findById(id: string) {
    return this.types.get(id) || null;
  }
  async findByName(tenantId: string, workspaceId: string, name: string) {
    for (const t of this.types.values()) {
      if (t.name === name) return t;
    }
    return null;
  }
  async listByWorkspace(tenantId: string, workspaceId: string) {
    return Array.from(this.types.values());
  }
  async delete(id: string) {
    this.types.delete(id);
  }
}

class InMemoryFieldRepo implements IFieldDefinitionRepository {
  private fields = new Map<string, FieldDefinition>();
  async save(field: FieldDefinition) {
    this.fields.set(field.id, field);
  }
  async findById(id: string) {
    return this.fields.get(id) || null;
  }
  async findByKey(tenantId: string, workspaceId: string, key: string) {
    for (const f of this.fields.values()) {
      if (f.key === key) return f;
    }
    return null;
  }
  async listByIds(ids: string[]) {
    return ids.map((id) => this.fields.get(id)!).filter(Boolean);
  }
  async listByWorkspace(tenantId: string, workspaceId: string) {
    return Array.from(this.fields.values());
  }
  async delete(id: string) {
    this.fields.delete(id);
  }
}

describe("Dynamic Metadata Platform - Domain & Services", () => {
  it("detects inheritance cycles", () => {
    const typesMap = new Map<string, ObjectTypeDefinition>([
      [
        "type-a",
        {
          id: "type-a",
          tenantId: "t1",
          workspaceId: "w1",
          name: "Type A",
          icon: "a",
          color: "red",
          parentTypeId: "type-b",
          fieldDefinitions: [],
          supportedViewIds: [],
          defaultActionIds: [],
          validationRules: [],
          systemType: false,
          isExtensible: true,
          version: 1,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ],
      [
        "type-b",
        {
          id: "type-b",
          tenantId: "t1",
          workspaceId: "w1",
          name: "Type B",
          icon: "b",
          color: "blue",
          parentTypeId: "type-a",
          fieldDefinitions: [],
          supportedViewIds: [],
          defaultActionIds: [],
          validationRules: [],
          systemType: false,
          isExtensible: true,
          version: 1,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ],
    ]);

    expect(() => {
      SchemaInheritanceFlattener.detectCycle("type-a", "type-b", typesMap);
    }).toThrow("Circular inheritance detected");
  });

  it("flattens inheritance fields correctly (Child overrides Parent)", () => {
    const parentField: FieldDefinition = {
      id: "f-priority",
      tenantId: "t1",
      workspaceId: "w1",
      key: "priority",
      name: "Priority",
      type: "Select",
      required: false,
      defaultValue: "low",
      searchable: true,
      filterable: true,
      sortable: true,
      aiVisible: true,
      editable: true,
      hidden: false,
      version: 1,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const childField: FieldDefinition = {
      id: "f-priority-override",
      tenantId: "t1",
      workspaceId: "w1",
      key: "priority",
      name: "Urgent Priority",
      type: "Select",
      required: true,
      defaultValue: "urgent",
      searchable: true,
      filterable: true,
      sortable: true,
      aiVisible: true,
      editable: true,
      hidden: false,
      version: 2,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const parentType: ObjectTypeDefinition = {
      id: "type-work-item",
      tenantId: "t1",
      workspaceId: "w1",
      name: "Work Item",
      icon: "check",
      color: "gray",
      fieldDefinitions: ["f-priority"],
      supportedViewIds: ["list"],
      defaultActionIds: [],
      validationRules: [],
      systemType: true,
      isExtensible: true,
      version: 1,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const childType: ObjectTypeDefinition = {
      id: "type-bug",
      tenantId: "t1",
      workspaceId: "w1",
      name: "Bug",
      icon: "bug",
      color: "red",
      parentTypeId: "type-work-item",
      fieldDefinitions: ["f-priority-override"],
      supportedViewIds: ["table"],
      defaultActionIds: [],
      validationRules: [],
      systemType: false,
      isExtensible: true,
      version: 1,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const typesMap = new Map([
      ["type-work-item", parentType],
      ["type-bug", childType],
    ]);
    const fieldsMap = new Map([
      ["f-priority", parentField],
      ["f-priority-override", childField],
    ]);

    const resolved = SchemaInheritanceFlattener.flatten(childType, typesMap, fieldsMap);

    expect(resolved.typeId).toBe("type-bug");
    expect(resolved.inheritanceChain).toEqual(["type-work-item", "type-bug"]);
    expect(resolved.fields.has("priority")).toBe(true);

    const mergedPriorityField = resolved.fields.get("priority");
    expect(mergedPriorityField?.id).toBe("f-priority-override");
    expect(mergedPriorityField?.required).toBe(true);
    expect(mergedPriorityField?.defaultValue).toBe("urgent");
  });

  it("validates payloads using 4-layer ValidationEngine & MetadataAppService", async () => {
    const typeRepo = new InMemoryObjectTypeRepo();
    const fieldRepo = new InMemoryFieldRepo();
    const appService = new MetadataAppService(typeRepo, fieldRepo);

    // Register Field: title (required text)
    const fieldTitle = await appService.registerField({
      tenantId: "t1",
      workspaceId: "w1",
      key: "title",
      name: "Title",
      type: "Text",
      required: true,
    });

    // Create Object Type: Task
    const taskType = await appService.createObjectType({
      tenantId: "t1",
      workspaceId: "w1",
      name: "Task",
      icon: "check",
      color: "green",
      fieldDefinitions: [fieldTitle.id],
    });

    // Test invalid payload (missing title)
    const invalidResult = await appService.validateObject(taskType.typeId, {});
    expect(invalidResult.valid).toBe(false);
    expect(invalidResult.errors.length).toBeGreaterThan(0);
    expect(invalidResult.errors[0]!.fieldKey).toBe("title");

    // Test valid payload
    const validResult = await appService.validateObject(taskType.typeId, { title: "Deploy Metadata Platform" });
    expect(validResult.valid).toBe(true);
    expect(validResult.errors).toHaveLength(0);
  });
});
