import nodeCron from "node-cron";
import { ConversationService } from "@/services/conversationService.js";
import { FormService } from "@/services/formService.js";

export const scheduleJobs = () => {
  nodeCron.schedule("*/50 * * * *", async () => {
    const conversationService = new ConversationService();
    const formService = new FormService();

    console.log(
      "Starting conversation cleanup job at",
      new Date().toISOString()
    );

    try {
      // Fetch and filter in_progress conversations older than 10 minutes
      const conversations = await conversationService.getAllConversations(
        "in_progress"
      );
      const conversationsToProcess = conversations.filter(
        (c) => c.startedAt < new Date(Date.now() - 10 * 60 * 1000)
      );

      if (conversationsToProcess.length === 0) {
        console.log("No stale in_progress conversations found.");
        return;
      }

      // Process conversations and collect form IDs
      const formIds: string[] = [];
      for (const conversation of conversationsToProcess) {
        try {
          console.log(`Processing conversation ${conversation.id}`);

          // Mark as abandon
          const abandonedConversation = await conversationService.abandon(
            conversation.id
          );
          if (!abandonedConversation) {
            console.error(`Failed to abandon conversation ${conversation.id}`);
            continue;
          }

          // Generate conversation summary
          const updatedConversation =
            await conversationService.generateConversationSummary(
              abandonedConversation
            );
          if (!updatedConversation) {
            console.error(
              `Failed to generate summary for conversation ${conversation.id}`
            );
            continue;
          }

          console.log(`Summary generated for conversation ${conversation.id}`);
          formIds.push(updatedConversation.formResponse.formId);
        } catch (error) {
          console.error(
            `Error processing conversation ${conversation.id}:`,
            error
          );
        }
      }

      // Process form summaries
      for (const formId of formIds) {
        try {
          console.log(`Generating summary for form ${formId}`);
          await formService.generateFormSummary(formId);
          console.log(`Summary generated for form ${formId}`);
        } catch (error) {
          console.error(`Error generating summary for form ${formId}:`, error);
        }
      }

      console.log("Conversation cleanup job completed.");
    } catch (error) {
      console.error("Error in conversation cleanup job:", error);
    }
  });
};

export default scheduleJobs;
