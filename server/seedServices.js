const dotenv = require("dotenv");
const connectDB = require("./config/db");
const Service = require("./models/Service");

dotenv.config();

const services = [
  {
    name: "Video Editing",
    slug: "video-editing",
    category: "Video",
    description:
      "Professional editing for reels, social media videos and other content.",
    pricingType: "starting_from",
    basePrice: 1000,
    fields: [
      {
        name: "projectType",
        label: "Project Type",
        type: "select",
        required: true,
        options: [
          {
            label: "Instagram Reel",
            value: "instagram_reel",
          },
          {
            label: "YouTube Video",
            value: "youtube_video",
          },
          {
            label: "Short Video",
            value: "short_video",
          },
          {
            label: "Other",
            value: "other",
          },
        ],
        order: 1,
      },
      {
        name: "videoDuration",
        label: "Approximate Video Duration",
        type: "select",
        required: true,
        options: [
          {
            label: "Up to 30 seconds",
            value: "up_to_30_seconds",
          },
          {
            label: "30–60 seconds",
            value: "30_to_60_seconds",
          },
          {
            label: "1–3 minutes",
            value: "1_to_3_minutes",
          },
          {
            label: "3–5 minutes",
            value: "3_to_5_minutes",
          },
          {
            label: "More than 5 minutes",
            value: "more_than_5_minutes",
          },
        ],
        order: 2,
      },
      {
        name: "quantity",
        label: "Number of Videos",
        type: "number",
        required: true,
        min: 1,
        max: 100,
        order: 3,
      },
      {
        name: "editingStyle",
        label: "Editing Style",
        type: "select",
        required: true,
        options: [
          {
            label: "Basic",
            value: "basic",
          },
          {
            label: "Standard",
            value: "standard",
          },
          {
            label: "Premium",
            value: "premium",
          },
        ],
        order: 4,
      },
      {
        name: "referenceLink",
        label: "Reference / Inspiration Link",
        type: "url",
        required: false,
        placeholder: "https://...",
        order: 5,
      },
      {
        name: "requirements",
        label: "Project Requirements",
        type: "textarea",
        required: true,
        placeholder:
          "Tell us about the video, style, content and requirements...",
        order: 6,
      },
    ],
  },

  {
    name: "Graphic Design",
    slug: "graphic-design",
    category: "Design",
    description:
      "Professional graphics for social media, marketing and digital content.",
    pricingType: "starting_from",
    basePrice: 500,
    fields: [
      {
        name: "designType",
        label: "Design Type",
        type: "select",
        required: true,
        options: [
          {
            label: "Social Media Post",
            value: "social_media_post",
          },
          {
            label: "Instagram Story",
            value: "instagram_story",
          },
          {
            label: "Thumbnail",
            value: "thumbnail",
          },
          {
            label: "Banner",
            value: "banner",
          },
          {
            label: "Other",
            value: "other",
          },
        ],
        order: 1,
      },
      {
        name: "quantity",
        label: "Number of Designs",
        type: "number",
        required: true,
        min: 1,
        max: 100,
        order: 2,
      },
      {
        name: "dimensions",
        label: "Required Dimensions",
        type: "text",
        required: false,
        placeholder: "Example: 1080 × 1080 px",
        order: 3,
      },
      {
        name: "referenceLink",
        label: "Reference / Inspiration Link",
        type: "url",
        required: false,
        placeholder: "https://...",
        order: 4,
      },
      {
        name: "requirements",
        label: "Design Requirements",
        type: "textarea",
        required: true,
        placeholder:
          "Describe the design, content, style and requirements...",
        order: 5,
      },
    ],
  },

  {
    name: "Video Shoot",
    slug: "video-shoot",
    category: "Production",
    description:
      "Professional video shooting and production services.",
    pricingType: "custom",
    basePrice: 0,
    fields: [
      {
        name: "shootType",
        label: "Shoot Type",
        type: "select",
        required: true,
        options: [
          {
            label: "Product Shoot",
            value: "product_shoot",
          },
          {
            label: "Social Media Content",
            value: "social_media_content",
          },
          {
            label: "Corporate",
            value: "corporate",
          },
          {
            label: "Event",
            value: "event",
          },
          {
            label: "Other",
            value: "other",
          },
        ],
        order: 1,
      },
      {
        name: "shootDate",
        label: "Preferred Shoot Date",
        type: "date",
        required: true,
        order: 2,
      },
      {
        name: "location",
        label: "Shoot Location",
        type: "text",
        required: true,
        placeholder: "Enter shoot location",
        order: 3,
      },
      {
        name: "duration",
        label: "Expected Shoot Duration",
        type: "select",
        required: true,
        options: [
          {
            label: "Up to 2 hours",
            value: "up_to_2_hours",
          },
          {
            label: "2–4 hours",
            value: "2_to_4_hours",
          },
          {
            label: "4–8 hours",
            value: "4_to_8_hours",
          },
          {
            label: "Full day",
            value: "full_day",
          },
        ],
        order: 4,
      },
      {
        name: "requirements",
        label: "Shoot Requirements",
        type: "textarea",
        required: true,
        placeholder:
          "Describe the shoot, equipment, people, location and other requirements...",
        order: 5,
      },
    ],
  },
];

const seedServices = async () => {
  try {
    await connectDB();

    for (const service of services) {
      await Service.findOneAndUpdate(
        { slug: service.slug },
        service,
        {
          upsert: true,
          new: true,
          setDefaultsOnInsert: true,
        }
      );
    }

    console.log("Services seeded successfully.");
    process.exit(0);
  } catch (error) {
    console.error("Service seeding failed:", error.message);
    process.exit(1);
  }
};

seedServices();