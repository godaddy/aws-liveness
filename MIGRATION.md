# Migration Guides

## From v1 to v2

The following breaking changes were made in v2:
- Everything was migrated from AWS SDK v2 to AWS SDK v3. This means that you must now pass in V3-generation client instances for liveness checks.
- The library is now ESM-only. If you are using CommonJS, you will need to use `import()` to load the library or convert the code using this library to ESM.