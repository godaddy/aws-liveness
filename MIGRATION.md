# Migration Guides

## From aws-liveness to @godaddy/liveness

Nothing has changed beyond adding a scope to the name of the package

## From v1 to v2

The following breaking changes were made in v2:
- Everything was migrated from AWS SDK v2 to AWS SDK v3. This means that you must now pass in V3-generation client instances for liveness checks.
- The library is now ESM-only. If you are using CommonJS, you will need to use `import()` to load the library or convert the code using this library to ESM.
- The package has been renamed to `@godaddy/aws-liveness` to follow the GoDaddy package naming convention. You will need to update your import statements accordingly.
