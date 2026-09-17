import {
  Check,
  ClipboardList,
  CreditCard,
  FileText,
  Settings2,
  Sparkles,
} from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";

const workflowSteps = [
  {
    number: "01",
    icon: ClipboardList,
    title: "Choose a service",
    description: "Select the service you would like to order.",
    status: "active",
  },
  {
    number: "02",
    icon: Settings2,
    title: "Quantity",
    description: "Select how many units you need.",
    status: "complete",
  },
  {
    number: "03",
    icon: FileText,
    title: "Project configuration",
    description: "Configure options and project requirements.",
    status: "complete",
  },
  {
    number: "04",
    icon: CreditCard,
    title: "Payment method",
    description: "Choose how you would like to complete payment.",
    status: "complete",
  },
];

const HomeHeroVisual = () => {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div className="relative mx-auto w-full max-w-[520px]">
      {/* =========================================
          SUBTLE AMBIENT GLOW
      ========================================= */}
      <div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute
          -inset-8
          rounded-[3rem]
          bg-zinc-900/[0.025]
          blur-3xl
        "
      />

      {/* =========================================
          MAIN WORKFLOW WINDOW
      ========================================= */}
      <motion.div
        initial={
          shouldReduceMotion
            ? { opacity: 1, y: 0 }
            : {
                opacity: 0,
                y: 18,
                scale: 0.985,
              }
        }
        animate={{
          opacity: 1,
          y: 0,
          scale: 1,
        }}
        transition={{
          duration: shouldReduceMotion ? 0 : 0.7,
          delay: shouldReduceMotion ? 0 : 0.1,
          ease: [0.22, 1, 0.36, 1],
        }}
        className="relative"
      >
        {/* =========================================
            OUTER FRAME
        ========================================= */}
        <div
          className="
            rounded-[25px]
            border
            border-zinc-200/90
            bg-white/95
            p-1.5
            shadow-[0_22px_65px_rgba(24,24,27,0.09)]
            backdrop-blur-xl
            sm:rounded-[28px]
            sm:p-2
          "
        >
          {/* =========================================
              PLATFORM WINDOW
          ========================================= */}
          <div
            className="
              overflow-hidden
              rounded-[20px]
              border
              border-zinc-200/80
              bg-[#fafafa]
              sm:rounded-[23px]
            "
          >
            {/* =========================================
                TOP BAR
            ========================================= */}
            <div
              className="
                flex
                h-11
                items-center
                justify-between
                border-b
                border-zinc-200/80
                bg-white
                px-3.5
                sm:h-12
                sm:px-4
              "
            >
              <div className="flex items-center gap-2.5">
                {/* Browser dots */}
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-zinc-300" />
                  <span className="h-2 w-2 rounded-full bg-zinc-300" />
                  <span className="h-2 w-2 rounded-full bg-zinc-300" />
                </div>

                <div className="hidden h-4 w-px bg-zinc-200 sm:block" />

                <span className="hidden text-[9px] font-bold tracking-[0.12em] text-zinc-400 sm:block">
                  GLOW VENTURES
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="hidden text-[9px] font-medium text-zinc-400 sm:block">
                  Client Platform
                </span>

                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-900 text-white">
                  <Sparkles size={11} strokeWidth={1.8} />
                </div>
              </div>
            </div>

            {/* =========================================
                WORKFLOW CONTENT
            ========================================= */}
            <div className="p-3.5 sm:p-4">
              {/* Header */}
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[8px] font-bold uppercase tracking-[0.18em] text-zinc-400 sm:text-[9px]">
                    New Order
                  </p>

                  <h3 className="mt-1 text-base font-bold tracking-[-0.035em] text-zinc-950 sm:text-lg">
                    Configure your order
                  </h3>

                  <p className="mt-1 text-[10px] leading-4 text-zinc-500 sm:text-[11px]">
                    Everything you need, from service to payment.
                  </p>
                </div>

                <div className="hidden rounded-full border border-zinc-200 bg-white px-2.5 py-1.5 text-[9px] font-semibold text-zinc-500 shadow-sm sm:block">
                  4 steps
                </div>
              </div>

              {/* =========================================
                  PROGRESS LINE
              ========================================= */}
              <div className="mt-4 flex items-center">
                {workflowSteps.map((step, index) => (
                  <div
                    key={step.number}
                    className="flex min-w-0 flex-1 items-center"
                  >
                    <div
                      className={`
                        flex
                        h-6
                        w-6
                        shrink-0
                        items-center
                        justify-center
                        rounded-full
                        border
                        text-[8px]
                        font-bold
                        ${
                          step.status === "active"
                            ? "border-zinc-900 bg-zinc-900 text-white"
                            : "border-zinc-300 bg-white text-zinc-500"
                        }
                      `}
                    >
                      {step.status === "complete" ? (
                        <Check size={10} strokeWidth={2.5} />
                      ) : (
                        step.number
                      )}
                    </div>

                    {index < workflowSteps.length - 1 && (
                      <div className="mx-1.5 h-px flex-1 bg-zinc-200 sm:mx-2" />
                    )}
                  </div>
                ))}
              </div>

              {/* =========================================
                  ACTIVE SERVICE CARD
              ========================================= */}
              <motion.div
                initial={
                  shouldReduceMotion
                    ? { opacity: 1, y: 0 }
                    : {
                        opacity: 0,
                        y: 8,
                      }
                }
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                transition={{
                  duration: shouldReduceMotion ? 0 : 0.45,
                  delay: shouldReduceMotion ? 0 : 0.3,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className="
                  mt-3
                  rounded-2xl
                  border
                  border-zinc-300
                  bg-white
                  p-3
                  shadow-[0_8px_25px_rgba(24,24,27,0.05)]
                  sm:p-3.5
                "
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[8px] font-bold uppercase tracking-[0.16em] text-zinc-400">
                      Step 1 · Choose a service
                    </p>

                    <p className="mt-1 text-xs font-bold text-zinc-900 sm:text-sm">
                      Select the service you would like to order.
                    </p>
                  </div>

                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-zinc-900 text-white">
                    <ClipboardList size={13} strokeWidth={1.8} />
                  </div>
                </div>

                {/* Selected service */}
                <div className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-[11px] font-semibold text-zinc-900 sm:text-xs">
                      Content Production
                    </p>

                    <p className="mt-0.5 text-[9px] text-zinc-500">
                      Strategy · Production · Content
                    </p>
                  </div>

                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white text-zinc-700 shadow-sm">
                    <Check size={11} strokeWidth={2.4} />
                  </div>
                </div>
              </motion.div>

              {/* =========================================
                  WORKFLOW SUMMARY
              ========================================= */}
              <div className="mt-2.5 grid grid-cols-3 gap-2">
                {/* Quantity */}
                <motion.div
                  initial={
                    shouldReduceMotion
                      ? { opacity: 1, y: 0 }
                      : {
                          opacity: 0,
                          y: 8,
                        }
                  }
                  animate={{
                    opacity: 1,
                    y: 0,
                  }}
                  transition={{
                    duration: shouldReduceMotion ? 0 : 0.4,
                    delay: shouldReduceMotion ? 0 : 0.42,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  className="
                    rounded-xl
                    border
                    border-zinc-200
                    bg-white
                    p-2.5
                  "
                >
                  <div className="flex items-center gap-1.5">
                    <Settings2
                      size={11}
                      className="text-zinc-400"
                      strokeWidth={1.8}
                    />

                    <span className="text-[8px] font-bold uppercase tracking-[0.12em] text-zinc-400">
                      02
                    </span>
                  </div>

                  <p className="mt-1.5 text-[10px] font-bold text-zinc-900 sm:text-[11px]">
                    Quantity
                  </p>

                  <p className="mt-0.5 text-[9px] text-zinc-500">
                    Select units
                  </p>
                </motion.div>

                {/* Configuration */}
                <motion.div
                  initial={
                    shouldReduceMotion
                      ? { opacity: 1, y: 0 }
                      : {
                          opacity: 0,
                          y: 8,
                        }
                  }
                  animate={{
                    opacity: 1,
                    y: 0,
                  }}
                  transition={{
                    duration: shouldReduceMotion ? 0 : 0.4,
                    delay: shouldReduceMotion ? 0 : 0.5,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  className="
                    rounded-xl
                    border
                    border-zinc-200
                    bg-white
                    p-2.5
                  "
                >
                  <div className="flex items-center gap-1.5">
                    <FileText
                      size={11}
                      className="text-zinc-400"
                      strokeWidth={1.8}
                    />

                    <span className="text-[8px] font-bold uppercase tracking-[0.12em] text-zinc-400">
                      03
                    </span>
                  </div>

                  <p className="mt-1.5 text-[10px] font-bold text-zinc-900 sm:text-[11px]">
                    Configuration
                  </p>

                  <p className="mt-0.5 text-[9px] text-zinc-500">
                    Project details
                  </p>
                </motion.div>

                {/* Payment */}
                <motion.div
                  initial={
                    shouldReduceMotion
                      ? { opacity: 1, y: 0 }
                      : {
                          opacity: 0,
                          y: 8,
                        }
                  }
                  animate={{
                    opacity: 1,
                    y: 0,
                  }}
                  transition={{
                    duration: shouldReduceMotion ? 0 : 0.4,
                    delay: shouldReduceMotion ? 0 : 0.58,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  className="
                    rounded-xl
                    border
                    border-zinc-200
                    bg-white
                    p-2.5
                  "
                >
                  <div className="flex items-center gap-1.5">
                    <CreditCard
                      size={11}
                      className="text-zinc-400"
                      strokeWidth={1.8}
                    />

                    <span className="text-[8px] font-bold uppercase tracking-[0.12em] text-zinc-400">
                      04
                    </span>
                  </div>

                  <p className="mt-1.5 text-[10px] font-bold text-zinc-900 sm:text-[11px]">
                    Payment
                  </p>

                  <p className="mt-0.5 text-[9px] text-zinc-500">
                    Choose method
                  </p>
                </motion.div>
              </div>

              {/* =========================================
                  FINAL STATUS
              ========================================= */}
              <motion.div
                initial={
                  shouldReduceMotion
                    ? { opacity: 1, y: 0 }
                    : {
                        opacity: 0,
                        y: 8,
                      }
                }
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                transition={{
                  duration: shouldReduceMotion ? 0 : 0.45,
                  delay: shouldReduceMotion ? 0 : 0.68,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className="
                  mt-2.5
                  flex
                  items-center
                  justify-between
                  gap-3
                  rounded-xl
                  border
                  border-zinc-200
                  bg-zinc-50
                  px-3
                  py-2.5
                "
              >
                <div className="flex min-w-0 items-center gap-2">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-zinc-900 text-white">
                    <Check size={12} strokeWidth={2.5} />
                  </div>

                  <div className="min-w-0">
                    <p className="text-[10px] font-bold text-zinc-900">
                      Ready to place your order
                    </p>

                    <p className="mt-0.5 truncate text-[9px] text-zinc-500">
                      Review your requirements and continue.
                    </p>
                  </div>
                </div>

                <div className="hidden shrink-0 items-center gap-1 text-[9px] font-semibold text-zinc-700 sm:flex">
                  Continue
                  <span aria-hidden="true">→</span>
                </div>
              </motion.div>
            </div>
          </div>
        </div>

        {/* =========================================
            STATIC FLOATING MESSAGE
            No movement
        =========================================
         <div
          className="
            absolute
            -bottom-4
            -left-2
            rounded-2xl
            border
            border-zinc-200/90
            bg-white/95
            px-3
            py-2.5
            shadow-[0_14px_35px_rgba(24,24,27,0.09)]
            backdrop-blur-xl
            sm:-left-5
            sm:px-3.5
            sm:py-3
          "
        >
           <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-zinc-900 text-white">
              <Check size={14} strokeWidth={2.2} />
            </div>

            <div>
              <p className="text-[10px] font-bold text-zinc-900 sm:text-[11px]">
                Simple ordering
              </p>

              <p className="mt-0.5 text-[9px] text-zinc-500 sm:text-[10px]">
                Clear from start to finish
              </p>
            </div>
          </div> 
        </div> */}

        {/* =========================================
            STATIC PLATFORM BADGE
            No movement
        ========================================= */}
        {/* <div
          className="
            absolute
            -right-1
            top-[10%]
            hidden
            items-center
            gap-2
            rounded-full
            border
            border-zinc-200
            bg-white/95
            px-3
            py-2
            text-[9px]
            font-semibold
            text-zinc-500
            shadow-[0_12px_30px_rgba(24,24,27,0.07)]
            backdrop-blur-xl
            sm:flex
          "
        >
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          Client platform
        </div> */}
      </motion.div>
    </div>
  );
};

export default HomeHeroVisual;
