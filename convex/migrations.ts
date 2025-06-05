/** @format */

import { Migrations } from "@convex-dev/migrations";
import { components, internal } from "./_generated/api.js";
import { DataModel } from "./_generated/dataModel.js";

export const migrations = new Migrations<DataModel>(components.migrations);
export const run = migrations.runner();

export const testArticleMigrationsTypeOne = migrations.define({
  table: "articles",
  customRange: (query) =>
    query.filter((q) => q.eq(q.field("testToMigrate"), true)),

  migrateOne: async (ctx, doc) => {
    console.log("migrating article", doc._id);
  },
  batchSize: 5,
});

export const doArticles = migrations.runner(
  internal.migrations.testArticleMigrationsTypeOne
);

