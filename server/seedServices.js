const dotenv = require("dotenv");
const connectDB = require("./config/db");
const Service = require("./models/Service");

dotenv.config();

const services = [
  /*
  |--------------------------------------------------------------------------
  | 1. Social Media Profile Management
  |--------------------------------------------------------------------------
  */

  {
    name: "Social Media Profile Management",
    slug: "social-media-profile-management",
    category: "Social Media",
    description:
      "Complete social media management including profile management, content posting, scheduling, uploading and comment management for one month.",

    pricingType: "per_unit",

    basePrice: 10000,

    unit: "profile",

    minQuantity: 1,

    fields: [
      {
        name: "platform",
        label: "Social Media Platform",
        type: "select",
        required: true,
        options: [
          {
            label: "Instagram",
            value: "instagram",
          },
          {
            label: "Facebook",
            value: "facebook",
          },
          {
            label: "LinkedIn",
            value: "linkedin",
          },
          {
            label: "YouTube",
            value: "youtube",
          },
          {
            label: "Other",
            value: "other",
          },
        ],
        order: 1,
      },

      {
        name: "profileLink",
        label: "Social Media Profile Link",
        type: "url",
        required: true,
        placeholder: "https://instagram.com/yourprofile",
        order: 2,
      },

      {
        name: "accountAccess",
        label: "Account / Access Information",
        type: "textarea",
        required: false,
        placeholder:
          "Provide relevant account access information or mention if access will be shared separately.",
        order: 3,
      },

      {
        name: "requirements",
        label: "Additional Requirements",
        type: "textarea",
        required: false,
        placeholder:
          "Tell us about your brand, posting requirements, content preferences or anything else we should know.",
        order: 4,
      },
    ],

    displayOrder: 1,

    isActive: true,
  },

  /*
  |--------------------------------------------------------------------------
  | 2. Professionally Created Social Media Grid Posts
  |--------------------------------------------------------------------------
  */

  {
    name: "Social Media Grid Posts",
    slug: "social-media-grid-posts",
    category: "Social Media",
    description:
      "Professionally created social media grid posts. Each line contains 3 coordinated images.",

    pricingType: "per_unit",

    basePrice: 6000,

    unit: "line",

    minQuantity: 1,

    fields: [
      {
        name: "platform",
        label: "Social Media Platform",
        type: "select",
        required: true,
        options: [
          {
            label: "Instagram",
            value: "instagram",
          },
          {
            label: "Facebook",
            value: "facebook",
          },
          {
            label: "LinkedIn",
            value: "linkedin",
          },
          {
            label: "Other",
            value: "other",
          },
        ],
        order: 1,
      },

      {
        name: "profileLink",
        label: "Social Media Profile Link",
        type: "url",
        required: false,
        placeholder: "https://instagram.com/yourprofile",
        order: 2,
      },

      {
        name: "brandInformation",
        label: "Brand / Content Information",
        type: "textarea",
        required: true,
        placeholder:
          "Provide the content, brand information, products, offers or topics that should be covered.",
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
        label: "Additional Requirements",
        type: "textarea",
        required: false,
        placeholder:
          "Share any design preferences, colors, style references or other requirements.",
        order: 5,
      },
    ],

    displayOrder: 2,

    isActive: true,
  },

  /*
  |--------------------------------------------------------------------------
  | 3. Festival Stories - Animated Graphics
  |--------------------------------------------------------------------------
  */

  {
    name: "Festival Stories - Animated Graphics",
    slug: "festival-stories-animated-graphics",
    category: "Social Media",
    description:
      "Animated festival story graphics covering festivals throughout one month.",

    pricingType: "per_unit",

    basePrice: 5000,

    unit: "profile",

    minQuantity: 1,

    fields: [
      {
        name: "platform",
        label: "Social Media Platform",
        type: "select",
        required: true,
        options: [
          {
            label: "Instagram",
            value: "instagram",
          },
          {
            label: "Facebook",
            value: "facebook",
          },
          {
            label: "Instagram + Facebook",
            value: "instagram_facebook",
          },
          {
            label: "Other",
            value: "other",
          },
        ],
        order: 1,
      },

      {
        name: "profileLink",
        label: "Social Media Profile Link",
        type: "url",
        required: false,
        placeholder: "https://instagram.com/yourprofile",
        order: 2,
      },

      {
        name: "month",
        label: "Month",
        type: "select",
        required: true,
        options: [
          { label: "January", value: "january" },
          { label: "February", value: "february" },
          { label: "March", value: "march" },
          { label: "April", value: "april" },
          { label: "May", value: "may" },
          { label: "June", value: "june" },
          { label: "July", value: "july" },
          { label: "August", value: "august" },
          { label: "September", value: "september" },
          { label: "October", value: "october" },
          { label: "November", value: "november" },
          { label: "December", value: "december" },
        ],
        order: 3,
      },

      {
        name: "requirements",
        label: "Additional Requirements",
        type: "textarea",
        required: false,
        placeholder:
          "Mention any specific festivals, themes, offers or design requirements.",
        order: 4,
      },
    ],

    displayOrder: 3,

    isActive: true,
  },

  /*
  |--------------------------------------------------------------------------
  | 4. Google Business Profile SEO + Reviews
  |--------------------------------------------------------------------------
  */

  {
    name: "Google Business Profile SEO & Reviews",
    slug: "google-business-profile-seo-reviews",
    category: "SEO",
    description:
      "Google Business Profile optimization and support for generating 5-star reviews for one month.",

    pricingType: "per_unit",

    basePrice: 5000,

    unit: "profile",

    minQuantity: 1,

    fields: [
      {
        name: "googleBusinessLink",
        label: "Google Business Profile Link",
        type: "url",
        required: true,
        placeholder: "https://g.page/your-business",
        order: 1,
      },

      {
        name: "businessName",
        label: "Business Name",
        type: "text",
        required: true,
        placeholder: "Enter your business name",
        order: 2,
      },

      {
        name: "businessLocation",
        label: "Business Location",
        type: "text",
        required: true,
        placeholder: "City / Area",
        order: 3,
      },

      {
        name: "requirements",
        label: "Additional Requirements",
        type: "textarea",
        required: false,
        placeholder:
          "Tell us about your business, target customers, services or any specific requirements.",
        order: 4,
      },
    ],

    displayOrder: 4,

    isActive: true,
  },

  /*
  |--------------------------------------------------------------------------
  | 5. Visual Content - Reels
  |--------------------------------------------------------------------------
  |
  | Selection structure:
  |
  | Shoot - Required - Select ONE
  |   - iPhone
  |   - Camera
  |
  | Drone - Optional - Select/Deselect
  |   - Drone
  |
  | Host - Optional - Select ONE
  |   - Exclusive
  |   - Local
  |   - Founder Faced
  |
  */

  {
    name: "Visual Content - Reels",
    slug: "visual-content-reels",
    category: "Visual Content",

    description:
      "Professional reel production with flexible shoot, drone and host options.",

    pricingType: "custom",

    basePrice: 0,

    unit: "reel",

    minQuantity: 1,

    pricingOptions: [
      /*
      |--------------------------------------------------------------------------
      | Shoot Group
      |--------------------------------------------------------------------------
      | Required - Select ONE
      |--------------------------------------------------------------------------
      */

      {
        name: "iPhone",
        description:
          "Professional reel shoot using iPhone with appropriate lighting and production setup.",

        price: 5000,

        unit: "reel",

        group: "shoot",

        minQuantity: 1,

        isActive: true,

        order: 1,

        fields: [
          {
            name: "shootLocation",
            label: "Shoot Location",
            type: "text",
            required: true,
            placeholder: "Enter the shoot location",
            order: 1,
          },

          {
            name: "preferredShootDate",
            label: "Preferred Shoot Date",
            type: "date",
            required: false,
            order: 2,
          },

          {
            name: "referenceLink",
            label: "Reference / Inspiration Link",
            type: "url",
            required: false,
            placeholder: "https://...",
            order: 3,
          },

          {
            name: "requirements",
            label: "Reel Requirements",
            type: "textarea",
            required: false,
            placeholder:
              "Tell us about the reel concept, product/service, style and other requirements.",
            order: 4,
          },
        ],
      },

      {
        name: "Camera",
        description:
          "Professional reel shoot using a mirrorless camera with professional lighting.",

        price: 3000,

        unit: "reel",

        group: "shoot",

        minQuantity: 1,

        isActive: true,

        order: 2,

        fields: [
          {
            name: "shootLocation",
            label: "Shoot Location",
            type: "text",
            required: true,
            placeholder: "Enter the shoot location",
            order: 1,
          },

          {
            name: "preferredShootDate",
            label: "Preferred Shoot Date",
            type: "date",
            required: false,
            order: 2,
          },

          {
            name: "referenceLink",
            label: "Reference / Inspiration Link",
            type: "url",
            required: false,
            placeholder: "https://...",
            order: 3,
          },

          {
            name: "requirements",
            label: "Reel Requirements",
            type: "textarea",
            required: false,
            placeholder:
              "Tell us about the reel concept, product/service, style and other requirements.",
            order: 4,
          },
        ],
      },

      /*
      |--------------------------------------------------------------------------
      | Drone Group
      |--------------------------------------------------------------------------
      | Optional - Select/Deselect
      |--------------------------------------------------------------------------
      */

      {
        name: "Drone",
        description:
          "Professional drone shoot with an experienced pilot.",

        price: 3500,

        unit: "shoot",

        group: "drone",

        minQuantity: 1,

        isActive: true,

        order: 3,

        fields: [
          {
            name: "droneShootLocation",
            label: "Drone Shoot Location",
            type: "text",
            required: true,
            placeholder: "Enter the drone shoot location",
            order: 1,
          },

          {
            name: "dronePreferredShootDate",
            label: "Preferred Drone Shoot Date",
            type: "date",
            required: false,
            order: 2,
          },

          {
            name: "droneRequirements",
            label: "Drone Shoot Requirements",
            type: "textarea",
            required: false,
            placeholder:
              "Tell us about the shots, location and other drone shoot requirements.",
            order: 3,
          },
        ],
      },

      /*
      |--------------------------------------------------------------------------
      | Host Group
      |--------------------------------------------------------------------------
      | Optional - Select ONE
      |--------------------------------------------------------------------------
      */

      {
        name: "Exclusive",
        description:
          "Custom and exclusive host for professionally produced reels.",

        price: 4000,

        unit: "reel",

        group: "host",

        minQuantity: 5,

        isActive: true,

        order: 4,

        fields: [
          {
            name: "hostRequirements",
            label: "Host Requirements",
            type: "textarea",
            required: false,
            placeholder:
              "Describe your preferred host, appearance, language, style or other requirements.",
            order: 1,
          },

          {
            name: "hostPreferredShootDate",
            label: "Preferred Shoot Date",
            type: "date",
            required: false,
            order: 2,
          },

          {
            name: "hostRequirementsDetails",
            label: "Reel Requirements",
            type: "textarea",
            required: false,
            placeholder:
              "Tell us about the reel concept and requirements.",
            order: 3,
          },
        ],
      },

      {
        name: "Local",
        description:
          "Local host for professionally produced reels.",

        price: 2800,

        unit: "reel",

        group: "host",

        minQuantity: 1,

        isActive: true,

        order: 5,

        fields: [
          {
            name: "hostRequirements",
            label: "Host Requirements",
            type: "textarea",
            required: false,
            placeholder:
              "Describe your preferred host, appearance, language, style or other requirements.",
            order: 1,
          },

          {
            name: "hostPreferredShootDate",
            label: "Preferred Shoot Date",
            type: "date",
            required: false,
            order: 2,
          },

          {
            name: "hostRequirementsDetails",
            label: "Reel Requirements",
            type: "textarea",
            required: false,
            placeholder:
              "Tell us about the reel concept and requirements.",
            order: 3,
          },
        ],
      },

      {
        name: "Founder Faced",
        description:
          "Founder face video production for reels.",

        price: 0,

        unit: "reel",

        group: "host",

        minQuantity: 1,

        isActive: true,

        order: 6,

        fields: [
          {
            name: "founderShootLocation",
            label: "Shoot Location",
            type: "text",
            required: true,
            placeholder: "Enter the shoot location",
            order: 1,
          },

          {
            name: "founderPreferredShootDate",
            label: "Preferred Shoot Date",
            type: "date",
            required: false,
            order: 2,
          },

          {
            name: "founderRequirements",
            label: "Video Requirements",
            type: "textarea",
            required: false,
            placeholder:
              "Provide a short brief about the founder video and what you want to achieve.",
            order: 3,
          },
        ],
      },
    ],

    fields: [],

    displayOrder: 5,

    isActive: true,
  },

  /*
  |--------------------------------------------------------------------------
  | 6. Ads
  |--------------------------------------------------------------------------
  */

  {
    name: "Ads",
    slug: "ads",
    category: "Advertising",
    description:
      "Meta Ads and Google Ads campaign management with custom city-based targeting.",

    pricingType: "custom",

    basePrice: 0,

    minQuantity: 1,

    pricingOptions: [
      {
        name: "Meta Ads",
        description:
          "Meta Ads campaign management for 30 days.",
        price: 30000,
        unit: "30 days",
        minQuantity: 1,
        isActive: true,
        order: 1,

        fields: [
          {
            name: "adSpendAmount",
            label: "Meta Ad Spend Amount",
            type: "number",
            required: true,
            min: 0,
            placeholder: "Enter Meta ad spend amount",
            order: 1,
          },

          {
            name: "adSpendDays",
            label: "Meta Ad Spend Days",
            type: "number",
            required: true,
            min: 1,
            placeholder: "Enter number of days",
            order: 2,
          },

          {
            name: "targetCities",
            label: "Target Cities",
            type: "textarea",
            required: true,
            placeholder:
              "Example: Ahmedabad, Surat, Vadodara",
            order: 3,
          },

          {
            name: "metaBusinessLink",
            label: "Meta Business / Ad Account Link",
            type: "url",
            required: false,
            placeholder:
              "https://business.facebook.com/...",
            order: 4,
          },

          {
            name: "requirements",
            label: "Campaign Requirements",
            type: "textarea",
            required: false,
            placeholder:
              "Tell us about your campaign goals, audience, products/services and other requirements.",
            order: 5,
          },
        ],
      },

      {
        name: "Google Ads",
        description:
          "Google Ads campaign management for 30 days.",
        price: 15000,
        unit: "30 days",
        minQuantity: 1,
        isActive: true,
        order: 2,

        fields: [
          {
            name: "adSpendAmount",
            label: "Google Ad Spend Amount",
            type: "number",
            required: true,
            min: 0,
            placeholder: "Enter Google ad spend amount",
            order: 1,
          },

          {
            name: "adSpendDays",
            label: "Google Ad Spend Days",
            type: "number",
            required: true,
            min: 1,
            placeholder: "Enter number of days",
            order: 2,
          },

          {
            name: "targetCities",
            label: "Target Cities",
            type: "textarea",
            required: true,
            placeholder:
              "Example: Ahmedabad, Surat, Vadodara",
            order: 3,
          },

          {
            name: "googleAdsAccountLink",
            label: "Google Ads Account Link",
            type: "url",
            required: false,
            placeholder:
              "https://ads.google.com/...",
            order: 4,
          },

          {
            name: "requirements",
            label: "Campaign Requirements",
            type: "textarea",
            required: false,
            placeholder:
              "Tell us about your campaign goals, audience, products/services and other requirements.",
            order: 5,
          },
        ],
      },
    ],

    fields: [],

    displayOrder: 6,

    isActive: true,
  },
];

/*
|--------------------------------------------------------------------------
| Seed Services
|--------------------------------------------------------------------------
*/

const seedServices = async () => {
  try {
    await connectDB();

    for (const service of services) {
      await Service.findOneAndUpdate(
        {
          slug: service.slug,
        },
        service,
        {
          upsert: true,
          new: true,
          setDefaultsOnInsert: true,
          runValidators: true,
        }
      );
    }

    console.log(
      `${services.length} services seeded successfully.`
    );

    process.exit(0);
  } catch (error) {
    console.error(
      "Service seeding failed:",
      error.message
    );

    process.exit(1);
  }
};

seedServices();