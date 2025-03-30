import { v4 as uuidv4 } from "uuid";
import * as bcrypt from "bcrypt";
import { AppDataSource } from "../config/data-source";
import { User, Form, Question } from "../entities/index";

async function seedDatabase() {
  console.log("Starting database seeding...");

  try {
    // Initialize the data source
    await AppDataSource.initialize();
    console.log("Database connection initialized");

    // Create admin user
    const passwordHash = await bcrypt.hash("Admin123!", 10);

    const adminUser = new User();
    adminUser.id = uuidv4();
    adminUser.email = "admin@example.com";
    adminUser.firstName = "Admin";
    adminUser.lastName = "User";
    adminUser.passwordHash = passwordHash;
    adminUser.isVerified = true;

    await AppDataSource.manager.save(adminUser);
    console.log("Admin user created:", adminUser.email);

    // Create a sample form
    const sampleForm = new Form();
    sampleForm.id = uuidv4();
    sampleForm.title = "Customer Feedback Form";
    sampleForm.description =
      "A form to collect customer feedback about our services";
    sampleForm.tone = "friendly";
    sampleForm.userId = adminUser.id;
    sampleForm.user = adminUser;
    sampleForm.settings = {
      welcomeMessage: "Thank you for taking the time to provide your feedback!",
      completionMessage: "Thanks for your feedback! We appreciate your input.",
      retryMessage: "Please try answering that question again.",
      theme: "light",
    };

    await AppDataSource.manager.save(sampleForm);
    console.log("Sample form created:", sampleForm.title);

    // Create sample questions
    const questions = [
      {
        text: "What is your name?",
        type: "text",
        order: 0,
        validationRules: { required: true, minLength: 2 },
        metadata: {
          helpText: "Please enter your full name",
          placeholderText: "John Doe",
        },
      },
      {
        text: "How would you rate our service?",
        type: "multiplechoice",
        order: 1,
        validationRules: {
          required: true,
          options: ["Excellent", "Good", "Average", "Poor", "Very Poor"],
        },
        metadata: {
          helpText: "Please select one option",
        },
      },
      {
        text: "What did you like most about our service?",
        type: "text",
        order: 2,
        validationRules: { required: false, maxLength: 500 },
        metadata: {
          helpText: "Please share what you enjoyed",
          placeholderText: "I liked...",
        },
      },
      {
        text: "What could we improve?",
        type: "text",
        order: 3,
        validationRules: { required: false, maxLength: 500 },
        metadata: {
          helpText: "Please share any suggestions for improvement",
          placeholderText: "You could improve...",
        },
      },
      {
        text: "Would you recommend our service to others?",
        type: "multiplechoice",
        order: 4,
        validationRules: {
          required: true,
          options: [
            "Definitely",
            "Probably",
            "Not sure",
            "Probably not",
            "Definitely not",
          ],
        },
        metadata: {},
      },
      {
        text: "Your email address for future updates:",
        type: "email",
        order: 5,
        validationRules: {
          required: false,
          pattern: "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$",
        },
        metadata: {
          helpText:
            "We'll only use this to send you updates about our services",
          placeholderText: "email@example.com",
        },
      },
    ];

    for (const q of questions) {
      const question = new Question();
      question.id = uuidv4();
      question.text = q.text;
      question.type = q.type;
      question.order = q.order;
      question.validationRules = q.validationRules;
      question.metadata = q.metadata;
      question.formId = sampleForm.id;
      question.form = sampleForm;

      await AppDataSource.manager.save(question);
    }

    console.log(`${questions.length} sample questions created`);
    console.log("Database seeding completed successfully");
  } catch (error) {
    console.error("Error during database seeding:", error);
  } finally {
    // Close the connection
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
      console.log("Database connection closed");
    }
  }
}

// Run the seeder
seedDatabase();
