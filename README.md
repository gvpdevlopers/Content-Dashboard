
```
content-dashboard
├─ client
│  ├─ .env
│  ├─ eslint.config.js
│  ├─ index.html
│  ├─ package-lock.json
│  ├─ package.json
│  ├─ public
│  │  ├─ favicon.png
│  │  ├─ icon.png
│  │  ├─ icons.svg
│  │  └─ Logo.png
│  ├─ README.md
│  ├─ src
│  │  ├─ App.css
│  │  ├─ App.jsx
│  │  ├─ assets
│  │  │  ├─ hero.png
│  │  │  ├─ react.svg
│  │  │  └─ vite.svg
│  │  ├─ components
│  │  │  ├─ AdminRoute.jsx
│  │  │  ├─ CustomSelect.jsx
│  │  │  ├─ OrderSuccess.jsx
│  │  │  ├─ ProtectedRoute.jsx
│  │  │  ├─ public
│  │  │  │  ├─ about
│  │  │  │  │  ├─ AboutCTA.jsx
│  │  │  │  │  ├─ AboutEcosystem.jsx
│  │  │  │  │  ├─ AboutHero.jsx
│  │  │  │  │  ├─ AboutProcess.jsx
│  │  │  │  │  └─ AboutStory.jsx
│  │  │  │  ├─ contact
│  │  │  │  │  ├─ ContactCTA.jsx
│  │  │  │  │  ├─ ContactForm.jsx
│  │  │  │  │  ├─ ContactHero.jsx
│  │  │  │  │  └─ ContactInfo.jsx
│  │  │  │  ├─ GradientText.jsx
│  │  │  │  ├─ hero
│  │  │  │  │  ├─ AboutHeroVisual.jsx
│  │  │  │  │  ├─ ContactHeroVisual.jsx
│  │  │  │  │  ├─ HomeHeroVisual.jsx
│  │  │  │  │  └─ ServicesHeroVisual.jsx
│  │  │  │  ├─ home
│  │  │  │  │  ├─ EcosystemSection.jsx
│  │  │  │  │  ├─ FinalCTA.jsx
│  │  │  │  │  ├─ HeroSection.jsx
│  │  │  │  │  ├─ HowItWorksSection.jsx
│  │  │  │  │  ├─ IntroSection.jsx
│  │  │  │  │  ├─ PlatformCTA.jsx
│  │  │  │  │  ├─ ServicesSection.jsx
│  │  │  │  │  └─ WhyGlowSection.jsx
│  │  │  │  ├─ legal
│  │  │  │  │  ├─ LegalHero.jsx
│  │  │  │  │  ├─ LegalLastUpdated.jsx
│  │  │  │  │  ├─ LegalLayout.jsx
│  │  │  │  │  └─ LegalSection.jsx
│  │  │  │  ├─ PageTransition.jsx
│  │  │  │  ├─ PublicButton.jsx
│  │  │  │  ├─ PublicFooter.jsx
│  │  │  │  ├─ PublicHeader.jsx
│  │  │  │  ├─ PublicHero.jsx
│  │  │  │  ├─ Reveal.jsx
│  │  │  │  ├─ Section.jsx
│  │  │  │  ├─ SectionHeading.jsx
│  │  │  │  ├─ services
│  │  │  │  │  ├─ ServiceCard.jsx
│  │  │  │  │  ├─ ServiceFilters.jsx
│  │  │  │  │  ├─ ServicesCTA.jsx
│  │  │  │  │  └─ ServicesHero.jsx
│  │  │  │  └─ Stagger.jsx
│  │  │  └─ ScrollToTop.jsx
│  │  ├─ context
│  │  │  └─ AuthContext.jsx
│  │  ├─ hooks
│  │  │  └─ useScrollProgress.js
│  │  ├─ index.css
│  │  ├─ layouts
│  │  │  ├─ AdminLayout.jsx
│  │  │  ├─ DashboardLayout.jsx
│  │  │  └─ PublicLayout.jsx
│  │  ├─ main.jsx
│  │  ├─ pages
│  │  │  ├─ About.jsx
│  │  │  ├─ admin
│  │  │  │  ├─ AdminCreateUser.jsx
│  │  │  │  ├─ AdminDashboard.jsx
│  │  │  │  ├─ AdminOrderDetails.jsx
│  │  │  │  ├─ AdminOrders.jsx
│  │  │  │  ├─ AdminUserDetails.jsx
│  │  │  │  ├─ AdminUsers.jsx
│  │  │  │  └─ CodManagement.jsx
│  │  │  ├─ Contact.jsx
│  │  │  ├─ Dashboard.jsx
│  │  │  ├─ Home.jsx
│  │  │  ├─ legal
│  │  │  │  ├─ PrivacyPolicy.jsx
│  │  │  │  ├─ RefundCancellation.jsx
│  │  │  │  └─ TermsConditions.jsx
│  │  │  ├─ Login.jsx
│  │  │  ├─ NewOrder.jsx
│  │  │  ├─ OrderDetails.jsx
│  │  │  ├─ OrderHistory.jsx
│  │  │  ├─ readme.md
│  │  │  └─ Services.jsx
│  │  └─ services
│  │     ├─ adminOrderService.js
│  │     ├─ adminUserService.js
│  │     ├─ api.js
│  │     ├─ authService.js
│  │     ├─ codService.js
│  │     ├─ orderService.js
│  │     ├─ paymentService.js
│  │     └─ serviceService.js
│  └─ vite.config.js
├─ README.md
└─ server
   ├─ .env
   ├─ config
   │  ├─ db.js
   │  └─ razorpay.js
   ├─ controllers
   │  ├─ adminUserController.js
   │  ├─ authController.js
   │  ├─ codController.js
   │  ├─ orderController.js
   │  ├─ paymentController.js
   │  └─ serviceController.js
   ├─ middleware
   │  ├─ admin.js
   │  └─ auth.js
   ├─ models
   │  ├─ Order.js
   │  ├─ Service.js
   │  └─ User.js
   ├─ package-lock.json
   ├─ package.json
   ├─ routes
   │  ├─ adminUserRoutes.js
   │  ├─ authRoutes.js
   │  ├─ codRoutes.js
   │  ├─ orderRoutes.js
   │  ├─ paymentRoutes.js
   │  └─ serviceRoutes.js
   ├─ seedAdmin.js
   ├─ seedServices.js
   ├─ server.js
   └─ utils
      └─ generateOrderNumber.js

```