const dotenv = require("dotenv");
const connectDB = require("./config/db");
const Service = require("./models/Service");

dotenv.config();

const services = [
  {
    "name": "Social Media Profile Management",
    "slug": "social-media-profile-management",
    "category": "Social Media",
    "description": "Complete social media management including profile management, content posting, scheduling, uploading and comment management for one month.",
    "pricingType": "per_unit",
    "basePrice": 10000,
    "unit": "profile",
    "minQuantity": 1,
    "pricingOptions": [],
    "fields": [
      {
        "name": "platform",
        "label": "Social Media Platform",
        "type": "select",
        "placeholder": "",
        "helpText": "",
        "required": true,
        "options": [
          {
            "label": "Instagram + Facebook",
            "value": "instagram_facebook",
            "price": 0
          },
          {
            "label": "LinkedIn",
            "value": "linkedin",
            "price": 0
          },
          {
            "label": "YouTube",
            "value": "youtube",
            "price": 0
          },
          {
            "label": "Other",
            "value": "other",
            "price": 0
          }
        ],
        "order": 1
      },
      {
        "name": "username",
        "label": "Username",
        "type": "text",
        "placeholder": "e.g. @yourbusiness",
        "helpText": "",
        "required": true,
        "options": [],
        "order": 2
      },
      {
        "name": "accountAccess",
        "label": "Account / Access Information",
        "type": "textarea",
        "placeholder": "Provide relevant account access information or mention if access will be shared separately.",
        "helpText": "",
        "required": false,
        "options": [],
        "order": 3
      },
      {
        "name": "requirements",
        "label": "Additional Requirements",
        "type": "textarea",
        "placeholder": "Tell us about your brand, posting requirements, content preferences or anything else we should know.",
        "helpText": "",
        "required": false,
        "options": [],
        "order": 4
      }
    ],
    "repeatableGroups": [],
    "displayOrder": 1,
    "isActive": true
  },
  {
    "name": "Social Media Grid Posts",
    "slug": "social-media-grid-posts",
    "category": "Social Media",
    "description": "Professionally created social media grid posts. Each line contains 3 coordinated images.",
    "pricingType": "per_unit",
    "basePrice": 6000,
    "unit": "line",
    "minQuantity": 1,
    "pricingOptions": [],
    "fields": [
      {
        "name": "platform",
        "label": "Social Media Platform",
        "type": "select",
        "placeholder": "",
        "helpText": "",
        "required": false,
        "options": [
          {
            "label": "Instagram",
            "value": "instagram",
            "price": 0
          },
          {
            "label": "Facebook",
            "value": "facebook",
            "price": 0
          },
          {
            "label": "LinkedIn",
            "value": "linkedin",
            "price": 0
          },
          {
            "label": "Other",
            "value": "other",
            "price": 0
          }
        ],
        "order": 1
      },
      {
        "name": "profileLink",
        "label": "Social Media Profile Link",
        "type": "url",
        "placeholder": "https://instagram.com/yourprofile",
        "helpText": "",
        "required": false,
        "options": [],
        "order": 2
      },
      {
        "name": "brandInformation",
        "label": "Brand / Content Information",
        "type": "textarea",
        "placeholder": "Provide the content, brand information, products, offers or topics that should be covered.",
        "helpText": "",
        "required": true,
        "options": [],
        "order": 3
      },
      {
        "name": "referenceLink",
        "label": "Reference / Inspiration Link",
        "type": "url",
        "placeholder": "https://...",
        "helpText": "",
        "required": false,
        "options": [],
        "order": 4
      },
      {
        "name": "requirements",
        "label": "Additional Requirements",
        "type": "textarea",
        "placeholder": "Share any design preferences, colors, style references or other requirements.",
        "helpText": "",
        "required": false,
        "options": [],
        "order": 5
      }
    ],
    "repeatableGroups": [],
    "displayOrder": 2,
    "isActive": true
  },
  {
    "name": "Festival Stories - Animated Graphics",
    "slug": "festival-stories-animated-graphics",
    "category": "Social Media",
    "description": "Animated festival story graphics covering festivals throughout one month.",
    "pricingType": "per_unit",
    "basePrice": 5000,
    "unit": "profile",
    "minQuantity": 1,
    "pricingOptions": [],
    "fields": [
      {
        "name": "platform",
        "label": "Social Media Platform",
        "type": "select",
        "placeholder": "",
        "helpText": "",
        "required": false,
        "options": [
          {
            "label": "Instagram",
            "value": "instagram",
            "price": 0
          },
          {
            "label": "Facebook",
            "value": "facebook",
            "price": 0
          },
          {
            "label": "Instagram + Facebook",
            "value": "instagram_facebook",
            "price": 0
          },
          {
            "label": "Other",
            "value": "other",
            "price": 0
          }
        ],
        "order": 1
      },
      {
        "name": "profileLink",
        "label": "Social Media Profile Link",
        "type": "url",
        "placeholder": "https://instagram.com/yourprofile",
        "helpText": "",
        "required": false,
        "options": [],
        "order": 2
      },
      {
        "name": "month",
        "label": "Month",
        "type": "select",
        "placeholder": "",
        "helpText": "",
        "required": true,
        "options": [
          {
            "label": "January",
            "value": "january",
            "price": 0
          },
          {
            "label": "February",
            "value": "february",
            "price": 0
          },
          {
            "label": "March",
            "value": "march",
            "price": 0
          },
          {
            "label": "April",
            "value": "april",
            "price": 0
          },
          {
            "label": "May",
            "value": "may",
            "price": 0
          },
          {
            "label": "June",
            "value": "june",
            "price": 0
          },
          {
            "label": "July",
            "value": "july",
            "price": 0
          },
          {
            "label": "August",
            "value": "august",
            "price": 0
          },
          {
            "label": "September",
            "value": "september",
            "price": 0
          },
          {
            "label": "October",
            "value": "october",
            "price": 0
          },
          {
            "label": "November",
            "value": "november",
            "price": 0
          },
          {
            "label": "December",
            "value": "december",
            "price": 0
          }
        ],
        "order": 3
      },
      {
        "name": "requirements",
        "label": "Additional Requirements",
        "type": "textarea",
        "placeholder": "Mention any specific festivals, themes, offers or design requirements.",
        "helpText": "",
        "required": false,
        "options": [],
        "order": 4
      }
    ],
    "repeatableGroups": [],
    "displayOrder": 3,
    "isActive": true
  },
  {
    "name": "Google Business Profile SEO & Reviews",
    "slug": "google-business-profile-seo-reviews",
    "category": "SEO",
    "description": "Google Business Profile optimization and support for generating 5-star reviews for one month.",
    "pricingType": "per_unit",
    "basePrice": 5000,
    "unit": "profile",
    "minQuantity": 1,
    "pricingOptions": [],
    "fields": [
      {
        "name": "googleBusinessLink",
        "label": "Google Business Profile Link or Name",
        "type": "text",
        "placeholder": "Enter the profile name or link",
        "helpText": "",
        "required": true,
        "options": [],
        "order": 1
      },
      {
        "name": "businessName",
        "label": "Business Name",
        "type": "text",
        "placeholder": "Enter your business name",
        "helpText": "",
        "required": false,
        "options": [],
        "order": 2
      },
      {
        "name": "businessLocation",
        "label": "Business Location",
        "type": "text",
        "placeholder": "City / Area",
        "helpText": "",
        "required": true,
        "options": [],
        "order": 3
      },
      {
        "name": "requirements",
        "label": "Additional Requirements",
        "type": "textarea",
        "placeholder": "Tell us about your business, target customers, services or any specific requirements.",
        "helpText": "",
        "required": false,
        "options": [],
        "order": 4
      }
    ],
    "repeatableGroups": [],
    "displayOrder": 4,
    "isActive": true
  },
  {
    "name": "Visual Content - Reels",
    "slug": "visual-content-reels",
    "category": "Visual Content",
    "description": "Professional reel production with flexible shoot, drone and host options.",
    "pricingType": "custom",
    "basePrice": 0,
    "unit": "reel",
    "minQuantity": 1,
    "pricingOptions": [
      {
        "name": "iPhone",
        "description": "Professional reel shoot using iPhone with appropriate lighting and production setup.",
        "price": 5000,
        "unit": "reel",
        "group": "shoot",
        "minQuantity": 1,
        "isActive": true,
        "fields": [],
        "order": 1,
        "_id": "6a9c0c15c5c693b1f9ec32ec"
      },
      {
        "name": "Camera",
        "description": "Professional reel shoot using a mirrorless camera with professional lighting.",
        "price": 3000,
        "unit": "reel",
        "group": "shoot",
        "minQuantity": 2,
        "isActive": true,
        "fields": [],
        "order": 2,
        "_id": "6a9c0c15c5c693b1f9ec32ed"
      },
      {
        "name": "Drone",
        "description": "Professional drone shoot with an experienced pilot.",
        "price": 3500,
        "unit": "shoot",
        "group": "drone",
        "minQuantity": 1,
        "isActive": true,
        "fields": [
          {
            "name": "droneShootLocation",
            "label": "Drone Shoot Location",
            "type": "text",
            "placeholder": "Enter the drone shoot location",
            "helpText": "",
            "required": false,
            "options": [],
            "order": 1
          },
          {
            "name": "dronePreferredShootDate",
            "label": "Preferred Drone Shoot Date",
            "type": "date",
            "placeholder": "",
            "helpText": "",
            "required": false,
            "options": [],
            "order": 2
          },
          {
            "name": "droneRequirements",
            "label": "Drone Shoot Requirements",
            "type": "textarea",
            "placeholder": "Tell us about the shots, location and other drone shoot requirements.",
            "helpText": "",
            "required": false,
            "options": [],
            "order": 3
          }
        ],
        "order": 3,
        "_id": "6a9c0c15c5c693b1f9ec32ee"
      },
      {
        "name": "Exclusive",
        "description": "Custom and exclusive host for professionally produced reels.",
        "price": 4000,
        "unit": "reel",
        "group": "host",
        "minQuantity": 5,
        "isActive": true,
        "fields": [
          {
            "name": "hostRequirements",
            "label": "Host Requirements",
            "type": "textarea",
            "placeholder": "Describe your preferred host, appearance, language, style or other requirements.",
            "helpText": "",
            "required": false,
            "options": [],
            "order": 1
          },
          {
            "name": "hostRequirementsDetails",
            "label": "Reel Requirements",
            "type": "textarea",
            "placeholder": "Tell us about the reel concept and requirements.",
            "helpText": "",
            "required": false,
            "options": [],
            "order": 3
          }
        ],
        "order": 4,
        "_id": "6a9c0c15c5c693b1f9ec32ef"
      },
      {
        "name": "Local",
        "description": "Local host for professionally produced reels.",
        "price": 2800,
        "unit": "reel",
        "group": "host",
        "minQuantity": 1,
        "isActive": true,
        "fields": [
          {
            "name": "hostRequirements",
            "label": "Host Requirements",
            "type": "textarea",
            "placeholder": "Describe your preferred host, appearance, language, style or other requirements.",
            "helpText": "",
            "required": false,
            "options": [],
            "order": 1
          },
          {
            "name": "hostRequirementsDetails",
            "label": "Reel Requirements",
            "type": "textarea",
            "placeholder": "Tell us about the reel concept and requirements.",
            "helpText": "",
            "required": false,
            "options": [],
            "order": 3
          }
        ],
        "order": 5,
        "_id": "6a9c0c15c5c693b1f9ec32f0"
      },
      {
        "name": "Founder Faced",
        "description": "Founder face video production for reels.",
        "price": 0,
        "unit": "reel",
        "group": "host",
        "minQuantity": 1,
        "isActive": true,
        "fields": [
          {
            "name": "founderShootLocation",
            "label": "Shoot Location",
            "type": "text",
            "placeholder": "Enter the shoot location",
            "helpText": "",
            "required": true,
            "options": [],
            "order": 1
          },
          {
            "name": "founderRequirements",
            "label": "Video Requirements",
            "type": "textarea",
            "placeholder": "Provide a short brief about the founder video and what you want to achieve.",
            "helpText": "",
            "required": false,
            "options": [],
            "order": 3
          }
        ],
        "order": 6,
        "_id": "6a9c0c15c5c693b1f9ec32f1"
      }
    ],
    "fields": [],
    "repeatableGroups": [
      {
        "name": "reels",
        "label": "Reel",
        "description": "Configure each reel separately.",
        "pricingGroups": [
          "shoot",
          "drone",
          "host"
        ],
        "requiredPricingGroups": [
          "shoot"
        ],
        "minItems": 1,
        "maxItems": 10,
        "isActive": true,
        "fields": [
          {
            "name": "shootLocation",
            "label": "Shoot Location",
            "type": "text",
            "placeholder": "Enter the shoot location",
            "helpText": "",
            "required": true,
            "options": [],
            "order": 1
          },
          {
            "name": "preferredShootDate",
            "label": "Preferred Shoot Date",
            "type": "date",
            "placeholder": "",
            "helpText": "Choose any date by leaving this blank if your schedule is flexible.",
            "required": false,
            "options": [],
            "order": 2
          },
          {
            "name": "referenceLink",
            "label": "Reference / Inspiration Link",
            "type": "url",
            "placeholder": "https://...",
            "helpText": "",
            "required": false,
            "options": [],
            "order": 3
          },
          {
            "name": "requirements",
            "label": "Reel Requirements",
            "type": "textarea",
            "placeholder": "Tell us about the reel concept, product/service, style and other requirements.",
            "helpText": "",
            "required": false,
            "options": [],
            "order": 4
          }
        ],
        "order": 0
      }
    ],
    "displayOrder": 5,
    "isActive": true
  },
  {
    "name": "Ads",
    "slug": "ads",
    "category": "Advertising",
    "description": "Meta Ads and Google Ads campaign management with custom city-based targeting.",
    "pricingType": "custom",
    "basePrice": 0,
    "unit": "",
    "minQuantity": 1,
    "pricingOptions": [
      {
        "name": "Meta Ads",
        "description": "Meta Ads campaign management for 30 days.",
        "price": 15000,
        "unit": "30 days",
        "group": "metaAds",
        "minQuantity": 1,
        "isActive": true,
        "fields": [
          {
            "name": "metaAdsAdSpendAmount",
            "label": "Meta Ad Spend Amount",
            "type": "number",
            "placeholder": "Enter Meta ad spend amount",
            "helpText": "This amount is included in your order total.",
            "required": true,
            "options": [],
            "min": 0,
            "order": 1,
            "includeValueInPrice": true
          },
          {
            "name": "metaAdsAdSpendDays",
            "label": "Meta Ad Spend Days",
            "type": "number",
            "placeholder": "Enter number of days",
            "helpText": "",
            "required": false,
            "options": [],
            "min": 1,
            "order": 2
          },
          {
            "name": "metaBusinessLink",
            "label": "Meta Business / Ad Account Link",
            "type": "url",
            "placeholder": "https://business.facebook.com/...",
            "helpText": "",
            "required": false,
            "options": [],
            "order": 4
          },
          {
            "name": "metaAdsRequirements",
            "label": "Campaign Requirements",
            "type": "textarea",
            "placeholder": "Tell us about your campaign goals, audience, products/services and other requirements.",
            "helpText": "",
            "required": false,
            "options": [],
            "order": 5
          }
        ],
        "order": 1,
        "_id": "6a9c0c15c5c693b1f9ec32f8"
      },
      {
        "name": "Google Ads",
        "description": "Google Ads campaign management for 30 days.",
        "price": 15000,
        "unit": "30 days",
        "group": "googleAds",
        "minQuantity": 1,
        "isActive": true,
        "fields": [
          {
            "name": "googleAdsAdSpendAmount",
            "label": "Google Ad Spend Amount",
            "type": "number",
            "placeholder": "Enter Google ad spend amount",
            "helpText": "This amount is included in your order total.",
            "required": true,
            "options": [],
            "min": 0,
            "order": 1,
            "includeValueInPrice": true
          },
          {
            "name": "googleAdsAdSpendDays",
            "label": "Google Ad Spend Days",
            "type": "number",
            "placeholder": "Enter number of days",
            "helpText": "",
            "required": false,
            "options": [],
            "min": 1,
            "order": 2
          },
          {
            "name": "googleAdsAccountLink",
            "label": "Google Ads Account Link",
            "type": "url",
            "placeholder": "https://ads.google.com/...",
            "helpText": "",
            "required": false,
            "options": [],
            "order": 4
          },
          {
            "name": "googleAdsRequirements",
            "label": "Campaign Requirements",
            "type": "textarea",
            "placeholder": "Tell us about your campaign goals, audience, products/services and other requirements.",
            "helpText": "",
            "required": false,
            "options": [],
            "order": 5
          }
        ],
        "order": 2,
        "_id": "6a9c0c15c5c693b1f9ec32f9"
      }
    ],
    "fields": [
      {
        "name": "targetCities",
        "label": "Target Cities",
        "type": "textarea",
        "placeholder": "Example: Ahmedabad, Surat, Vadodara",
        "helpText": "",
        "required": true,
        "options": [],
        "order": 1
      }
    ],
    "repeatableGroups": [],
    "displayOrder": 6,
    "isActive": true
  }
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