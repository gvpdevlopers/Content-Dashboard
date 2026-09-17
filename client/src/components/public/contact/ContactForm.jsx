import { useEffect, useRef, useState } from "react";

import {
  AlertCircle,
  ArrowUpRight,
  Check,
  CheckCircle2,
  ChevronDown,
  Loader2,
  Send,
} from "lucide-react";

import Reveal from "../Reveal";
import PublicButton from "../PublicButton";

const CONTACT_EMAIL = "team@glowventures.org";

const initialForm = {
  name: "",
  email: "",
  phone: "",
  company: "",
  service: "",
  message: "",
};

const serviceOptions = [
  "Internet Marketing",
  "Public Relations",
  "Content Production",
  "Other / Not sure yet",
];

const ContactForm = () => {
  const [formData, setFormData] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [status, setStatus] = useState("idle");
  const [serviceOpen, setServiceOpen] = useState(false);
  const [activeServiceIndex, setActiveServiceIndex] = useState(-1);

  const serviceDropdownRef = useRef(null);
  const serviceTriggerRef = useRef(null);
  const serviceOptionsRef = useRef(null);

  /* ==========================================================
      VALIDATION
  ========================================================== */

  const validateField = (name, value) => {
    const trimmedValue = value.trim();

    switch (name) {
      case "name":
        if (!trimmedValue) {
          return "Please enter your name.";
        }

        if (trimmedValue.length < 2) {
          return "Please enter at least 2 characters.";
        }

        return "";

      case "email":
        if (!trimmedValue) {
          return "Please enter your email address.";
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedValue)) {
          return "Please enter a valid email address.";
        }

        return "";

      case "phone":
        if (!trimmedValue) {
          return "Please enter your phone number.";
        }

        if (!/^[+()\d\s-]{7,20}$/.test(trimmedValue)) {
          return "Please enter a valid phone number.";
        }

        return "";

      case "service":
        if (!trimmedValue) {
          return "Please select a service.";
        }

        return "";

      case "message":
        if (!trimmedValue) {
          return "Please tell us a little about your requirement.";
        }

        if (trimmedValue.length < 10) {
          return "Please provide a little more detail.";
        }

        return "";

      default:
        return "";
    }
  };

  const validateForm = () => {
    const nextErrors = {};

    Object.entries(formData).forEach(([name, value]) => {
      const error = validateField(name, value);

      if (error) {
        nextErrors[name] = error;
      }
    });

    setErrors(nextErrors);

    setTouched({
      name: true,
      email: true,
      phone: true,
      company: true,
      service: true,
      message: true,
    });

    return Object.keys(nextErrors).length === 0;
  };

  /* ==========================================================
      FIELD HANDLERS
  ========================================================== */

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((current) => ({
      ...current,
      [name]: value,
    }));

    if (touched[name]) {
      setErrors((current) => ({
        ...current,
        [name]: validateField(name, value),
      }));
    }

    if (status !== "idle") {
      setStatus("idle");
    }
  };

  const handleBlur = (event) => {
    const { name, value } = event.target;

    setTouched((current) => ({
      ...current,
      [name]: true,
    }));

    setErrors((current) => ({
      ...current,
      [name]: validateField(name, value),
    }));
  };

  /* ==========================================================
      CUSTOM SERVICE DROPDOWN
  ========================================================== */

  const handleServiceSelect = (option) => {
    setFormData((current) => ({
      ...current,
      service: option,
    }));

    setTouched((current) => ({
      ...current,
      service: true,
    }));

    setErrors((current) => ({
      ...current,
      service: "",
    }));

    setServiceOpen(false);
    setActiveServiceIndex(-1);

    if (status !== "idle") {
      setStatus("idle");
    }

    requestAnimationFrame(() => {
      serviceTriggerRef.current?.focus();
    });
  };

  const handleServiceKeyDown = (event) => {
    if (!serviceOpen) {
      if (
        event.key === "ArrowDown" ||
        event.key === "ArrowUp" ||
        event.key === "Enter" ||
        event.key === " "
      ) {
        event.preventDefault();
        setServiceOpen(true);
        setActiveServiceIndex(
          formData.service
            ? serviceOptions.indexOf(formData.service)
            : 0,
        );
      }

      return;
    }

    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();

        setActiveServiceIndex((current) =>
          current >= serviceOptions.length - 1
            ? 0
            : current + 1,
        );
        break;

      case "ArrowUp":
        event.preventDefault();

        setActiveServiceIndex((current) =>
          current <= 0
            ? serviceOptions.length - 1
            : current - 1,
        );
        break;

      case "Enter":
      case " ":
        event.preventDefault();

        if (activeServiceIndex >= 0) {
          handleServiceSelect(
            serviceOptions[activeServiceIndex],
          );
        }
        break;

      case "Escape":
        event.preventDefault();
        setServiceOpen(false);
        setActiveServiceIndex(-1);
        break;

      case "Tab":
        setServiceOpen(false);
        setActiveServiceIndex(-1);
        break;

      default:
        break;
    }
  };

  /* Close dropdown when clicking outside */
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        serviceDropdownRef.current &&
        !serviceDropdownRef.current.contains(event.target)
      ) {
        setServiceOpen(false);
        setActiveServiceIndex(-1);
      }
    };

    document.addEventListener(
      "mousedown",
      handleClickOutside,
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside,
      );
    };
  }, []);

  /* Scroll active option into view */
  useEffect(() => {
    if (
      !serviceOpen ||
      activeServiceIndex < 0 ||
      !serviceOptionsRef.current
    ) {
      return;
    }

    const activeOption =
      serviceOptionsRef.current.children[activeServiceIndex];

    activeOption?.scrollIntoView({
      block: "nearest",
    });
  }, [activeServiceIndex, serviceOpen]);

  /* ==========================================================
      SUBMIT
  ========================================================== */

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!validateForm()) {
      setStatus("idle");
      return;
    }

    setStatus("submitting");

    const subject = encodeURIComponent(
      `New enquiry from ${formData.name}`,
    );

    const body = encodeURIComponent(
      [
        `Name: ${formData.name}`,
        `Email: ${formData.email}`,
        `Phone: ${formData.phone}`,
        `Company: ${formData.company || "Not provided"}`,
        `Service: ${formData.service}`,
        "",
        "Message:",
        formData.message,
      ].join("\n"),
    );

    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;

    setTimeout(() => {
      setStatus("success");
    }, 400);
  };

  /* ==========================================================
      RESET FORM
  ========================================================== */

  const resetForm = () => {
    setStatus("idle");
    setFormData(initialForm);
    setErrors({});
    setTouched({});
    setServiceOpen(false);
    setActiveServiceIndex(-1);
  };

  /* ==========================================================
      FIELD STYLES
  ========================================================== */

  const getFieldClasses = (name) => {
    const hasError = Boolean(
      touched[name] && errors[name],
    );

    const hasValue = Boolean(formData[name]);

    return `
      mt-2
      h-12
      w-full
      rounded-2xl
      border
      bg-white
      px-4
      text-sm
      text-zinc-900
      outline-none
      transition-all
      duration-300
      placeholder:text-zinc-400
      ${
        hasError
          ? `
            border-red-300
            bg-red-50/30
            hover:border-red-400
            focus:border-red-400
            focus:ring-4
            focus:ring-red-500/10
          `
          : `
            border-zinc-200
            hover:border-zinc-300
            focus:border-zinc-900
            focus:ring-4
            focus:ring-zinc-900/[0.07]
          `
      }
      ${
        hasValue && !hasError
          ? "border-zinc-300"
          : ""
      }
    `;
  };

  const getTextareaClasses = (name) => {
    const hasError = Boolean(
      touched[name] && errors[name],
    );

    const hasValue = Boolean(formData[name]);

    return `
      mt-2
      min-h-[140px]
      w-full
      resize-y
      rounded-2xl
      border
      bg-white
      px-4
      py-3.5
      text-sm
      leading-6
      text-zinc-900
      outline-none
      transition-all
      duration-300
      placeholder:text-zinc-400
      ${
        hasError
          ? `
            border-red-300
            bg-red-50/30
            hover:border-red-400
            focus:border-red-400
            focus:ring-4
            focus:ring-red-500/10
          `
          : `
            border-zinc-200
            hover:border-zinc-300
            focus:border-zinc-900
            focus:ring-4
            focus:ring-zinc-900/[0.07]
          `
      }
      ${
        hasValue && !hasError
          ? "border-zinc-300"
          : ""
      }
    `;
  };

  /* ==========================================================
      ERROR MESSAGE
  ========================================================== */

  const renderError = (name) => {
    if (!touched[name] || !errors[name]) {
      return null;
    }

    return (
      <div
        className="
          mt-2
          flex
          items-start
          gap-1.5
          text-xs
          font-medium
          leading-5
          text-red-600
        "
        role="alert"
      >
        <AlertCircle
          size={13}
          strokeWidth={2}
          className="mt-0.5 shrink-0"
          aria-hidden="true"
        />

        <span>{errors[name]}</span>
      </div>
    );
  };

  const hasValidationErrors =
    Object.keys(errors).length > 0 &&
    Object.keys(touched).some(
      (field) => touched[field],
    );

  /* ==========================================================
      RENDER
  ========================================================== */

  return (
    <Reveal delay={0.1}>
      <div
        className="
          relative
          overflow-hidden
          rounded-[28px]
          border
          border-zinc-200/90
          bg-[var(--color-surface-soft)]
          p-5
          shadow-[0_8px_30px_rgba(24,24,27,0.035)]
          sm:p-7
          lg:p-8
        "
      >
        {/* Ambient glow */}
        <div
          aria-hidden="true"
          className="
            pointer-events-none
            absolute
            -right-24
            -top-24
            h-64
            w-64
            rounded-full
            bg-zinc-200/50
            blur-3xl
          "
        />

        <div className="relative">
          {/* ==================================================
              HEADER
          =================================================== */}
          <div>
            <div
              className="
                inline-flex
                items-center
                gap-1.5
                rounded-full
                border
                border-zinc-200/80
                bg-white/80
                px-3
                py-1.5
                text-[11px]
                font-semibold
                tracking-[0.11em]
                text-zinc-500
                shadow-[0_2px_8px_rgba(0,0,0,0.035)]
                backdrop-blur-md
                sm:gap-2
                sm:px-3.5
                sm:text-xs
              "
            >
              <Send
                size={13}
                strokeWidth={1.7}
                aria-hidden="true"
              />

              <span>Send an enquiry</span>
            </div>

            <h3
              className="
                mt-5
                text-2xl
                font-bold
                tracking-[-0.04em]
                text-zinc-950
                sm:text-3xl
              "
            >
              Tell us what you're building.
            </h3>

            <p
              className="
                mt-2
                max-w-xl
                text-sm
                leading-6
                text-zinc-500
                sm:text-base
                sm:leading-7
              "
            >
              Share a few details about your project and our team
              will get back to you.
            </p>
          </div>

          {/* ==================================================
              SUCCESS STATE
          =================================================== */}
          {status === "success" ? (
            <div
              className="
                mt-8
                rounded-[22px]
                border
                border-emerald-200
                bg-emerald-50
                p-6
                sm:p-7
              "
              role="status"
            >
              <div
                className="
                  flex
                  h-11
                  w-11
                  items-center
                  justify-center
                  rounded-2xl
                  border
                  border-emerald-200
                  bg-white
                  text-emerald-600
                "
              >
                <CheckCircle2
                  size={20}
                  strokeWidth={1.8}
                  aria-hidden="true"
                />
              </div>

              <h4
                className="
                  mt-5
                  text-lg
                  font-bold
                  tracking-[-0.025em]
                  text-zinc-900
                "
              >
                Your enquiry is ready to send.
              </h4>

              <p
                className="
                  mt-2
                  text-sm
                  leading-6
                  text-zinc-600
                "
              >
                Your email client should have opened with the
                enquiry details. If it did not, please contact us
                directly at {CONTACT_EMAIL}.
              </p>

              <button
                type="button"
                onClick={resetForm}
                className="
                  mt-5
                  text-sm
                  font-semibold
                  text-zinc-900
                  underline
                  underline-offset-4
                  transition-colors
                  hover:text-zinc-500
                "
              >
                Send another enquiry
              </button>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              noValidate
              className="mt-7"
            >
              {/* =================================================
                  BASIC DETAILS
              ================================================== */}
              <div className="grid gap-5 sm:grid-cols-2">
                {/* Name */}
                <div>
                  <label
                    htmlFor="name"
                    className="
                      text-xs
                      font-bold
                      tracking-[-0.01em]
                      text-zinc-700
                    "
                  >
                    Name{" "}
                    <span className="text-red-500">*</span>
                  </label>

                  <input
                    id="name"
                    name="name"
                    type="text"
                    value={formData.name}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    autoComplete="name"
                    placeholder="Your name"
                    aria-invalid={
                      touched.name &&
                      Boolean(errors.name)
                    }
                    aria-describedby={
                      touched.name && errors.name
                        ? "name-error"
                        : undefined
                    }
                    className={getFieldClasses("name")}
                  />

                  {errors.name && touched.name && (
                    <div id="name-error">
                      {renderError("name")}
                    </div>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label
                    htmlFor="email"
                    className="
                      text-xs
                      font-bold
                      tracking-[-0.01em]
                      text-zinc-700
                    "
                  >
                    Email{" "}
                    <span className="text-red-500">*</span>
                  </label>

                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    autoComplete="email"
                    placeholder="you@example.com"
                    aria-invalid={
                      touched.email &&
                      Boolean(errors.email)
                    }
                    aria-describedby={
                      touched.email && errors.email
                        ? "email-error"
                        : undefined
                    }
                    className={getFieldClasses("email")}
                  />

                  {errors.email && touched.email && (
                    <div id="email-error">
                      {renderError("email")}
                    </div>
                  )}
                </div>

                {/* Phone */}
                <div>
                  <label
                    htmlFor="phone"
                    className="
                      text-xs
                      font-bold
                      tracking-[-0.01em]
                      text-zinc-700
                    "
                  >
                    Phone{" "}
                    <span className="text-red-500">*</span>
                  </label>

                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    autoComplete="tel"
                    placeholder="+91 00000 00000"
                    aria-invalid={
                      touched.phone &&
                      Boolean(errors.phone)
                    }
                    aria-describedby={
                      touched.phone && errors.phone
                        ? "phone-error"
                        : undefined
                    }
                    className={getFieldClasses("phone")}
                  />

                  {errors.phone && touched.phone && (
                    <div id="phone-error">
                      {renderError("phone")}
                    </div>
                  )}
                </div>

                {/* Company */}
                <div>
                  <label
                    htmlFor="company"
                    className="
                      text-xs
                      font-bold
                      tracking-[-0.01em]
                      text-zinc-700
                    "
                  >
                    Company

                    <span
                      className="
                        ml-1
                        font-normal
                        text-zinc-400
                      "
                    >
                      Optional
                    </span>
                  </label>

                  <input
                    id="company"
                    name="company"
                    type="text"
                    value={formData.company}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    autoComplete="organization"
                    placeholder="Company name"
                    className={getFieldClasses("company")}
                  />
                </div>
              </div>

              {/* =================================================
                  CUSTOM SERVICE DROPDOWN
              ================================================== */}
              <div className="mt-5">
                <label
                  htmlFor="service"
                  className="
                    text-xs
                    font-bold
                    tracking-[-0.01em]
                    text-zinc-700
                  "
                >
                  Service{" "}
                  <span className="text-red-500">*</span>
                </label>

                <div
                  ref={serviceDropdownRef}
                  className="relative mt-2"
                >
                  {/* Trigger */}
                  <button
                    ref={serviceTriggerRef}
                    id="service"
                    type="button"
                    onClick={() => {
                      setServiceOpen((current) => {
                        const next = !current;

                        if (next) {
                          setActiveServiceIndex(
                            formData.service
                              ? serviceOptions.indexOf(
                                  formData.service,
                                )
                              : 0,
                          );
                        } else {
                          setActiveServiceIndex(-1);
                        }

                        return next;
                      });
                    }}
                    onBlur={() => {
                      setTimeout(() => {
                        if (
                          !serviceDropdownRef.current?.contains(
                            document.activeElement,
                          )
                        ) {
                          setTouched((current) => ({
                            ...current,
                            service: true,
                          }));

                          setErrors((current) => ({
                            ...current,
                            service: validateField(
                              "service",
                              formData.service,
                            ),
                          }));

                          setServiceOpen(false);
                          setActiveServiceIndex(-1);
                        }
                      }, 0);
                    }}
                    onKeyDown={handleServiceKeyDown}
                    aria-haspopup="listbox"
                    aria-expanded={serviceOpen}
                    aria-invalid={
                      touched.service &&
                      Boolean(errors.service)
                    }
                    aria-describedby={
                      touched.service && errors.service
                        ? "service-error"
                        : undefined
                    }
                    className={`
                      flex
                      h-12
                      w-full
                      items-center
                      justify-between
                      rounded-2xl
                      border
                      bg-white
                      px-4
                      text-left
                      text-sm
                      outline-none
                      transition-all
                      duration-300
                      ${
                        touched.service && errors.service
                          ? `
                            border-red-300
                            bg-red-50/30
                            hover:border-red-400
                            focus:border-red-400
                            focus:ring-4
                            focus:ring-red-500/10
                          `
                          : `
                            border-zinc-200
                            hover:border-zinc-300
                            focus:border-zinc-900
                            focus:ring-4
                            focus:ring-zinc-900/[0.07]
                          `
                      }
                      ${
                        serviceOpen
                          ? `
                            border-zinc-900
                            ring-4
                            ring-zinc-900/[0.07]
                          `
                          : ""
                      }
                    `}
                  >
                    <span
                      className={
                        formData.service
                          ? "text-zinc-900"
                          : "text-zinc-400"
                      }
                    >
                      {formData.service ||
                        "Select a service"}
                    </span>

                    <ChevronDown
                      size={16}
                      strokeWidth={1.8}
                      className={`
                        shrink-0
                        text-zinc-400
                        transition-transform
                        duration-300
                        ${
                          serviceOpen
                            ? "rotate-180 text-zinc-700"
                            : ""
                        }
                      `}
                      aria-hidden="true"
                    />
                  </button>

                  {/* Dropdown */}
                  {serviceOpen && (
                    <div
                      className="
                        absolute
                        left-0
                        right-0
                        top-[calc(100%+8px)]
                        z-50
                        overflow-hidden
                        rounded-2xl
                        border
                        border-zinc-200
                        bg-white
                        p-1.5
                        shadow-[0_18px_45px_rgba(24,24,27,0.12)]
                      "
                    >
                      <div
                        ref={serviceOptionsRef}
                        className="
                          max-h-60
                          overflow-y-auto
                          scrollbar-none
                        "
                        role="listbox"
                        aria-label="Select a service"
                      >
                        {serviceOptions.map(
                          (option, index) => {
                            const isSelected =
                              formData.service === option;

                            const isActive =
                              activeServiceIndex ===
                              index;

                            return (
                              <button
                                key={option}
                                type="button"
                                role="option"
                                aria-selected={isSelected}
                                onMouseEnter={() =>
                                  setActiveServiceIndex(
                                    index,
                                  )
                                }
                                onMouseDown={(event) => {
                                  event.preventDefault();
                                }}
                                onClick={() =>
                                  handleServiceSelect(
                                    option,
                                  )
                                }
                                className={`
                                  group/option
                                  flex
                                  w-full
                                  items-center
                                  justify-between
                                  rounded-xl
                                  px-3.5
                                  py-3
                                  text-left
                                  text-sm
                                  transition-all
                                  duration-200
                                  ${
                                    isSelected
                                      ? `
                                        bg-zinc-950
                                        text-white
                                      `
                                      : isActive
                                        ? `
                                          bg-zinc-100
                                          text-zinc-950
                                        `
                                        : `
                                          text-zinc-700
                                          hover:bg-zinc-50
                                          hover:text-zinc-950
                                        `
                                  }
                                `}
                              >
                                <span>{option}</span>

                                <span
                                  className={`
                                    flex
                                    h-6
                                    w-6
                                    items-center
                                    justify-center
                                    rounded-full
                                    transition-all
                                    duration-200
                                    ${
                                      isSelected
                                        ? `
                                          bg-white/10
                                          text-white
                                        `
                                        : `
                                          text-transparent
                                          group-hover/option:text-zinc-300
                                        `
                                    }
                                  `}
                                >
                                  <Check
                                    size={13}
                                    strokeWidth={2}
                                  />
                                </span>
                              </button>
                            );
                          },
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {errors.service && touched.service && (
                  <div id="service-error">
                    {renderError("service")}
                  </div>
                )}
              </div>

              {/* =================================================
                  MESSAGE
              ================================================== */}
              <div className="mt-5">
                <label
                  htmlFor="message"
                  className="
                    text-xs
                    font-bold
                    tracking-[-0.01em]
                    text-zinc-700
                  "
                >
                  Project details{" "}
                  <span className="text-red-500">*</span>
                </label>

                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="Tell us about your project, goals, timeline, or requirements..."
                  aria-invalid={
                    touched.message &&
                    Boolean(errors.message)
                  }
                  aria-describedby={
                    touched.message && errors.message
                      ? "message-error"
                      : undefined
                  }
                  className={getTextareaClasses("message")}
                />

                {errors.message && touched.message && (
                  <div id="message-error">
                    {renderError("message")}
                  </div>
                )}

                <div className="mt-2 flex justify-end">
                  <span className="text-[10px] font-medium text-zinc-400">
                    {formData.message.length} characters
                  </span>
                </div>
              </div>

              {/* =================================================
                  VALIDATION SUMMARY
              ================================================== */}
              {hasValidationErrors && (
                <div
                  className="
                    mt-6
                    flex
                    items-start
                    gap-3
                    rounded-[18px]
                    border
                    border-red-200
                    bg-red-50/70
                    px-4
                    py-3.5
                    text-sm
                    text-red-700
                  "
                  role="alert"
                >
                  <AlertCircle
                    size={17}
                    strokeWidth={1.8}
                    className="mt-0.5 shrink-0"
                    aria-hidden="true"
                  />

                  <div>
                    <p className="font-semibold">
                      Please review the highlighted fields.
                    </p>

                    <p className="mt-0.5 text-xs leading-5 text-red-600/80">
                      Complete the required information before
                      sending your enquiry.
                    </p>
                  </div>
                </div>
              )}

              {/* =================================================
                  SUBMIT
              ================================================== */}
              <div className="mt-7">
                <PublicButton
                  type="submit"
                  variant="primary"
                  className="
                    w-full
                    sm:w-auto
                    sm:min-w-[180px]
                  "
                  showArrow={status !== "submitting"}
                  disabled={status === "submitting"}
                >
                  {status === "submitting" ? (
                    <>
                      <Loader2
                        size={16}
                        className="animate-spin"
                        aria-hidden="true"
                      />

                      <span>Sending...</span>
                    </>
                  ) : (
                    "Send Enquiry"
                  )}
                </PublicButton>
              </div>

              <p
                className="
                  mt-4
                  text-[11px]
                  leading-5
                  text-zinc-400
                "
              >
                By submitting this form, you agree to be
                contacted regarding your enquiry.
              </p>
            </form>
          )}
        </div>
      </div>
    </Reveal>
  );
};

export default ContactForm;