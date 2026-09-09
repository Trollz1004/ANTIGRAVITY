-- Preserve the selected board seat separately from the service and model that
-- actually executed a response. Existing rows remain valid with NULL values.
ALTER TABLE `messages`
  ADD COLUMN `executionProvider` varchar(64) NULL AFTER `model`,
  ADD COLUMN `executionModel` varchar(128) NULL AFTER `executionProvider`;
