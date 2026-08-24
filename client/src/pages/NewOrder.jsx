import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  ArrowRight,
  Loader2,
  CreditCard,
  Banknote,
  Check,
} from "lucide-react";

import OrderSuccess from "../components/OrderSuccess";
import orderService from "../services/orderService";
import serviceService from "../services/serviceService";
import paymentService from "../services/paymentService";
import CustomSelect from "../components/CustomSelect";

const NewOrder = () => {
  const [services, setServices] = useState([]);
  const [selectedService, setSelectedService] = useState(null);

  const [formData, setFormData] = useState({});

  const [paymentMethod, setPaymentMethod] = useState("cod");

  const [loadingServices, setLoadingServices] = useState(true);
  const [loadingService, setLoadingService] = useState(false);

  const [error, setError] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(null);

  /* =========================================================
     LOAD SERVICES
  ========================================================= */

  useEffect(() => {
    const loadServices = async () => {
      try {
        setLoadingServices(true);
        setError("");

        const data = await serviceService.getServices();

        setServices(data.services || []);

        if (data.services?.length > 0) {
          setSelectedService(data.services[0]);
        }
      } catch (error) {
        console.error("Failed to load services:", error);

        setError(
          error.response?.data?.message ||
            "Unable to load services."
        );
      } finally {
        setLoadingServices(false);
      }
    };

    loadServices();
  }, []);

  /* =========================================================
     SERVICE CHANGE
  ========================================================= */

  const handleServiceChange = async (serviceId) => {
    try {
      setLoadingService(true);
      setError("");

      const data =
        await serviceService.getServiceById(serviceId);

      setSelectedService(data.service);

      setFormData({});
    } catch (error) {
      console.error("Failed to load service:", error);

      setError(
        error.response?.data?.message ||
          "Unable to load selected service."
      );
    } finally {
      setLoadingService(false);
    }
  };

  /* =========================================================
     FIELD CHANGE
  ========================================================= */

  const handleFieldChange = (fieldName, value) => {
    setFormData((current) => ({
      ...current,
      [fieldName]: value,
    }));
  };

  /* =========================================================
     SORT DYNAMIC FIELDS
  ========================================================= */

  const sortedFields = useMemo(() => {
    if (!selectedService?.fields) {
      return [];
    }

    return [...selectedService.fields].sort(
      (a, b) => (a.order || 0) - (b.order || 0)
    );
  }, [selectedService]);

  /* =========================================================
     ESTIMATED PRICE
  ========================================================= */

  const estimatedPrice = useMemo(() => {
    if (!selectedService) {
      return 0;
    }

    const quantity = Number(formData.quantity || 1);

    if (selectedService.pricingType === "fixed") {
      return selectedService.basePrice;
    }

    if (selectedService.pricingType === "starting_from") {
      return selectedService.basePrice * quantity;
    }

    return selectedService.basePrice;
  }, [selectedService, formData.quantity]);

  /* =========================================================
     SUBMIT ORDER
  ========================================================= */

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!selectedService) {
      setError("Please select a service.");
      return;
    }

    try {
      setSubmitting(true);
      setError("");

      // 1. Create our internal order
      const orderResponse = await orderService.createOrder({
        serviceId: selectedService._id,
        formData,
        paymentMethod,
      });

      const createdOrder = orderResponse.order;

      // 2. COD flow
      if (paymentMethod === "cod") {
        setOrderSuccess(createdOrder);
        return;
      }

      // 3. Online payment
      if (paymentMethod === "online") {
        const razorpayResponse =
          await paymentService.createRazorpayOrder(
            createdOrder._id || createdOrder.id
          );

        const razorpayOrder =
          razorpayResponse.razorpayOrder;

        if (!window.Razorpay) {
          throw new Error(
            "Razorpay Checkout failed to load."
          );
        }

        const options = {
          key: import.meta.env.VITE_RAZORPAY_KEY_ID,

          amount: razorpayOrder.amount,

          currency: razorpayOrder.currency,

          name: "Glow Ventures",

          description: createdOrder.service?.name
            ? `${createdOrder.service.name} Order`
            : "Content Service Order",

          order_id: razorpayOrder.id,

          handler: async function (response) {
            try {
              setSubmitting(true);
              setError("");

              const verification =
                await paymentService.verifyRazorpayPayment({
                  orderId:
                    createdOrder._id ||
                    createdOrder.id,

                  razorpay_order_id:
                    response.razorpay_order_id,

                  razorpay_payment_id:
                    response.razorpay_payment_id,

                  razorpay_signature:
                    response.razorpay_signature,
                });

              if (verification.success) {
                setOrderSuccess(verification.order);
              }
            } catch (error) {
              console.error(
                "Payment verification error:",
                error
              );

              setError(
                error.response?.data?.message ||
                  "Payment verification failed."
              );
            } finally {
              setSubmitting(false);
            }
          },

          prefill: {
            name: "",
            email: "",
            contact: "",
          },

          theme: {
            color: "#ffffff",
          },

          modal: {
            ondismiss: function () {
              setSubmitting(false);

              setError(
                "Payment was cancelled. You can try again from your order."
              );
            },
          },
        };

        console.log(
          "Razorpay frontend key:",
          import.meta.env.VITE_RAZORPAY_KEY_ID
        );

        const razorpay =
          new window.Razorpay(options);

        razorpay.open();
      }
    } catch (error) {
      console.error(
        "Create order/payment error:",
        error
      );

      const responseData =
        error.response?.data;

      if (responseData?.errors) {
        const firstError = Object.values(
          responseData.errors
        )[0];

        setError(firstError);
      } else {
        setError(
          responseData?.message ||
            error.message ||
            "Unable to process your order."
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  /* =========================================================
     SUCCESS SCREEN
  ========================================================= */

  if (orderSuccess) {
    return <OrderSuccess order={orderSuccess} />;
  }

  return (
    <div className="mx-auto max-w-[1100px]">

      {/* =====================================================
          PAGE HEADER
      ====================================================== */}

      <div className="mb-8">

        <div className="flex items-center gap-3">

          <div
            className="
              flex h-9 w-9
              items-center justify-center
              rounded-xl
              border border-white/10
              bg-white/[0.04]
              text-white/60
            "
          >
            <ArrowRight
              size={17}
              strokeWidth={1.7}
            />
          </div>

          <div>
            <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-white/30">
              Orders
            </p>

            <h1 className="mt-1 text-3xl font-medium tracking-tight sm:text-4xl">
              Place a new order
            </h1>
          </div>

        </div>

        <p className="mt-4 max-w-2xl text-sm leading-6 text-white/40 sm:text-[15px]">
          Tell us what you need and provide the details
          for your project.
        </p>

      </div>

      {/* =====================================================
          ERROR
      ====================================================== */}

      {error && (
        <div
          className="
            mb-6
            rounded-2xl
            border border-red-500/20
            bg-red-500/[0.08]
            px-4 py-3
            text-sm text-red-300
            shadow-[0_10px_30px_rgba(239,68,68,0.04)]
          "
        >
          {error}
        </div>
      )}

      {/* =====================================================
          LOADING / FORM
      ====================================================== */}

      {loadingServices ? (
        <div
          className="
            flex min-h-[300px]
            items-center justify-center
            rounded-[28px]
            border border-white/10
            bg-white/[0.02]
            backdrop-blur-xl
          "
        >
          <div className="flex items-center gap-3 text-sm text-white/40">
            <Loader2
              size={18}
              className="animate-spin"
            />
            Loading services...
          </div>
        </div>
      ) : services.length === 0 ? (
        <div
          className="
            rounded-[28px]
            border border-white/10
            bg-white/[0.02]
            p-10
            text-center
            backdrop-blur-xl
          "
        >
          <p className="text-sm text-white/40">
            No services are currently available.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>

          {/* =================================================
              MAIN FORM
          ================================================== */}

          <div
            className="
              relative
              overflow-hidden
              rounded-[28px]
              border border-white/10
              bg-[#111111]/90
              p-5
              shadow-[0_20px_70px_rgba(0,0,0,0.25)]
              backdrop-blur-2xl
              sm:p-7
              lg:p-8
            "
          >

            {/* Background glow */}

            <div
              className="
                pointer-events-none
                absolute
                -right-32
                -top-32
                h-72
                w-72
                rounded-full
                bg-white/[0.035]
                blur-3xl
              "
            />

            <div className="relative">

              {/* =================================================
                  SERVICE
              ================================================== */}

              <div>

                <label
                  className="
                    mb-2.5
                    block
                    text-sm
                    font-medium
                    text-white/70
                  "
                >
                  Select Service
                </label>

                <CustomSelect
                  value={selectedService?._id || ""}
                  onChange={handleServiceChange}
                  options={services.map((service) => ({
                    value: service._id,
                    label: service.name,
                  }))}
                  disabled={loadingService}
                />

                {selectedService?.description && (
                  <p className="mt-2.5 text-xs leading-5 text-white/35">
                    {selectedService.description}
                  </p>
                )}

              </div>

              {/* =================================================
                  DYNAMIC FIELDS
              ================================================== */}

              <div className="mt-8 border-t border-white/10 pt-8">

                <div className="mb-6">

                  <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-white/30">
                    Project Details
                  </p>

                  <h2 className="mt-2 text-lg font-medium">
                    Tell us about your project
                  </h2>

                </div>

                {loadingService ? (
                  <div className="flex items-center gap-3 text-sm text-white/40">
                    <Loader2
                      size={18}
                      className="animate-spin"
                    />
                    Loading fields...
                  </div>
                ) : (
                  <div className="grid gap-5 sm:grid-cols-2">

                    {sortedFields.map((field) => (
                      <DynamicField
                        key={field.name}
                        field={field}
                        value={
                          formData[field.name] || ""
                        }
                        onChange={(value) =>
                          handleFieldChange(
                            field.name,
                            value
                          )
                        }
                      />
                    ))}

                  </div>
                )}

              </div>

              {/* =================================================
                  PRICE
              ================================================== */}

              <div className="mt-8 border-t border-white/10 pt-8">

                <div
                  className="
                    relative
                    overflow-hidden
                    rounded-2xl
                    border border-white/10
                    bg-white/[0.025]
                    p-5
                    transition-all
                    duration-300
                    hover:border-white/[0.16]
                    hover:bg-white/[0.035]
                  "
                >

                  <div
                    className="
                      pointer-events-none
                      absolute
                      right-0
                      top-0
                      h-32
                      w-32
                      rounded-full
                      bg-white/[0.03]
                      blur-3xl
                    "
                  />

                  <div className="relative flex items-center justify-between gap-5">

                    <div>
                      <p className="text-sm font-medium">
                        Estimated Price
                      </p>

                      <p className="mt-1 text-xs leading-5 text-white/35">
                        Final pricing may depend on project
                        requirements.
                      </p>
                    </div>

                    <div className="shrink-0 text-xl font-medium tracking-tight">
                      ₹
                      {estimatedPrice.toLocaleString(
                        "en-IN"
                      )}
                    </div>

                  </div>

                </div>

              </div>

              {/* =================================================
                  PAYMENT
              ================================================== */}

              <div className="mt-8 border-t border-white/10 pt-8">

                <div className="mb-5">

                  <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-white/30">
                    Payment
                  </p>

                  <h2 className="mt-2 text-lg font-medium">
                    Choose payment method
                  </h2>

                </div>

                <div className="grid gap-4 sm:grid-cols-2">

                  <PaymentOption
                    selected={
                      paymentMethod === "cod"
                    }
                    onClick={() =>
                      setPaymentMethod("cod")
                    }
                    icon={Banknote}
                    title="COD"
                    description="Pay through our collection process"
                  />

                  <PaymentOption
                    selected={
                      paymentMethod === "online"
                    }
                    onClick={() =>
                      setPaymentMethod("online")
                    }
                    icon={CreditCard}
                    title="Pay Online"
                    description="Pay securely using Razorpay"
                  />

                </div>

              </div>

              {/* =================================================
                  SUBMIT
              ================================================== */}

              <div className="mt-8 flex justify-end border-t border-white/10 pt-8">

                <button
                  type="submit"
                  disabled={
                    loadingService || submitting
                  }
                  className="
                    group
                    relative
                    flex
                    w-full
                    items-center
                    justify-center
                    gap-2
                    overflow-hidden
                    rounded-xl
                    bg-white
                    px-6
                    py-3.5
                    text-sm
                    font-medium
                    text-black
                    shadow-[0_10px_30px_rgba(255,255,255,0.08)]
                    transition-all
                    duration-300
                    hover:-translate-y-0.5
                    hover:shadow-[0_15px_40px_rgba(255,255,255,0.12)]
                    active:translate-y-0
                    disabled:cursor-not-allowed
                    disabled:opacity-50
                    sm:w-auto
                  "
                >

                  {/* Button shine */}

                  <span
                    className="
                      pointer-events-none
                      absolute
                      inset-0
                      -translate-x-full
                      bg-gradient-to-r
                      from-transparent
                      via-black/[0.06]
                      to-transparent
                      transition-transform
                      duration-700
                      group-hover:translate-x-full
                    "
                  />

                  <span className="relative flex items-center gap-2">

                    {submitting ? (
                      <>
                        <Loader2
                          size={17}
                          className="animate-spin"
                        />
                        Creating Order...
                      </>
                    ) : (
                      <>
                        Place Order

                        <ArrowRight
                          size={17}
                          className="
                            transition-transform
                            duration-300
                            group-hover:translate-x-1
                          "
                        />
                      </>
                    )}

                  </span>

                </button>

              </div>

            </div>

          </div>

        </form>
      )}

    </div>
  );
};

/* ============================================================
   DYNAMIC FIELD
============================================================ */

const DynamicField = ({
  field,
  value,
  onChange,
}) => {

  const commonClasses = `
    w-full
    rounded-xl
    border border-white/10
    bg-white/[0.035]
    px-4 py-3.5
    text-sm
    text-white
    outline-none
    transition-all
    duration-300
    placeholder:text-white/25
    hover:border-white/15
    hover:bg-white/[0.05]
    focus:border-white/30
    focus:bg-white/[0.07]
    focus:ring-1
    focus:ring-white/10
  `;

  const renderField = () => {

    switch (field.type) {

      case "textarea":

        return (
          <textarea
            value={value}
            onChange={(event) =>
              onChange(event.target.value)
            }
            placeholder={field.placeholder}
            required={field.required}
            rows={5}
            className={`${commonClasses} resize-none`}
          />
        );

      case "select":

        return (
          <CustomSelect
            value={value}
            onChange={onChange}
            placeholder={`Select ${field.label}`}
            options={
              field.options?.map((option) => ({
                value: option.value,
                label: option.label,
              })) || []
            }
          />
        );

      case "number":

        return (
          <input
            type="number"
            value={value}
            onChange={(event) =>
              onChange(event.target.value)
            }
            placeholder={field.placeholder}
            required={field.required}
            min={field.min}
            max={field.max}
            className={commonClasses}
          />
        );

      case "date":

        return (
          <input
            type="date"
            value={value}
            onChange={(event) =>
              onChange(event.target.value)
            }
            required={field.required}
            className={commonClasses}
          />
        );

      case "url":

        return (
          <input
            type="url"
            value={value}
            onChange={(event) =>
              onChange(event.target.value)
            }
            placeholder={field.placeholder}
            required={field.required}
            className={commonClasses}
          />
        );

      default:

        return (
          <input
            type="text"
            value={value}
            onChange={(event) =>
              onChange(event.target.value)
            }
            placeholder={field.placeholder}
            required={field.required}
            className={commonClasses}
          />
        );
    }
  };

  return (
    <div
      className={
        field.type === "textarea"
          ? "sm:col-span-2"
          : ""
      }
    >

      <label className="mb-2.5 block text-sm text-white/65">

        {field.label}

        {field.required && (
          <span className="ml-1 text-white/30">
            *
          </span>
        )}

      </label>

      {renderField()}

    </div>
  );
};

/* ============================================================
   PAYMENT OPTION
============================================================ */

const PaymentOption = ({
  selected,
  onClick,
  icon: Icon,
  title,
  description,
}) => {

  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        group
        relative
        flex
        items-start
        gap-4
        overflow-hidden
        rounded-2xl
        border
        p-5
        text-left
        transition-all
        duration-300

        ${
          selected
            ? `
              border-white/30
              bg-white/[0.08]
              shadow-[0_10px_35px_rgba(255,255,255,0.04)]
            `
            : `
              border-white/10
              bg-white/[0.02]
              hover:-translate-y-0.5
              hover:border-white/20
              hover:bg-white/[0.045]
            `
        }
      `}
    >

      {selected && (
        <div
          className="
            pointer-events-none
            absolute
            -right-10
            -top-10
            h-28
            w-28
            rounded-full
            bg-white/[0.04]
            blur-2xl
          "
        />
      )}

      <div
        className={`
          relative
          flex h-10 w-10
          shrink-0
          items-center
          justify-center
          rounded-xl
          transition-all
          duration-300

          ${
            selected
              ? `
                bg-white
                text-black
                shadow-[0_5px_20px_rgba(255,255,255,0.08)]
              `
              : `
                border border-white/10
                bg-white/[0.03]
                text-white/50
                group-hover:border-white/20
                group-hover:text-white/70
              `
          }
        `}
      >
        <Icon size={18} />
      </div>

      <div className="relative pr-6">

        <p className="text-sm font-medium">
          {title}
        </p>

        <p className="mt-1 text-xs leading-5 text-white/35">
          {description}
        </p>

      </div>

      {selected && (
        <div
          className="
            absolute
            right-4
            top-4
            flex h-5 w-5
            items-center
            justify-center
            rounded-full
            bg-white
            text-black
            shadow-[0_3px_15px_rgba(255,255,255,0.08)]
          "
        >
          <Check size={13} />
        </div>
      )}

    </button>
  );
};

export default NewOrder;