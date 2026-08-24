import { useState } from "react";

import {
  ArrowLeft,
  UserPlus,
} from "lucide-react";

import { useNavigate } from "react-router-dom";

import adminUserService from "../../services/adminUserService";

import CustomSelect from "../../components/CustomSelect";

const AdminCreateUser = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    username: "",
    password: "",
    role: "client",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setLoading(true);
      setError("");
      setSuccess("");

      await adminUserService.createUser(formData);

      setSuccess("User created successfully.");

      setTimeout(() => {
        navigate("/admin/users");
      }, 700);
    } catch (error) {
      console.error("Create user error:", error);

      setError(
        error.response?.data?.message ||
          "Unable to create user."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-[1000px] animate-fade-up">

      {/* =====================================================
          HEADER
      ====================================================== */}

      <div className="mb-8">

        <button
          type="button"
          onClick={() => navigate("/admin/users")}
          className="
            group
            mb-5
            inline-flex
            items-center
            gap-2
            rounded-lg
            py-1
            pr-3
            text-sm
            text-zinc-500
            transition
            duration-200
            hover:text-zinc-900
          "
        >
          <ArrowLeft
            size={16}
            className="
              transition-transform
              duration-200
              group-hover:-translate-x-1
            "
          />

          Back to Users
        </button>

        <div className="flex items-center gap-3">

          <div
            className="
              flex h-10 w-10
              items-center justify-center
              rounded-xl
              border border-zinc-200
              bg-white
              text-zinc-500
              shadow-sm
            "
          >
            <UserPlus
              size={18}
              strokeWidth={1.7}
            />
          </div>

          <div>

            <p
              className="
                text-[10px]
                font-medium
                uppercase
                tracking-[0.2em]
                text-zinc-400
              "
            >
              Administration
            </p>

            <h1
              className="
                mt-1
                text-3xl
                font-medium
                tracking-tight
                text-zinc-900
                sm:text-4xl
              "
            >
              Add User
            </h1>

          </div>
        </div>

        <p
          className="
            mt-4
            max-w-xl
            text-sm
            leading-6
            text-zinc-500
          "
        >
          Create a new client or administrator account.
        </p>
      </div>

      {/* =====================================================
          FORM
      ====================================================== */}

      <form
        onSubmit={handleSubmit}
        className="
          relative
          overflow-hidden
          rounded-[28px]
          border border-zinc-200
          bg-white
          p-5
          shadow-[0_20px_70px_rgba(0,0,0,0.05)]
          sm:p-7
          lg:p-8
        "
      >
        {/* Ambient glow */}

        <div
          className="
            pointer-events-none
            absolute
            -right-28
            -top-28
            h-64
            w-64
            rounded-full
            bg-cyan-300/[0.025]
            blur-3xl
          "
        />

        <div className="relative">

          {/* =================================================
              FORM INTRO
          ================================================== */}

          <div className="mb-7">

            <p
              className="
                text-[10px]
                font-medium
                uppercase
                tracking-[0.18em]
                text-zinc-400
              "
            >
              Account Information
            </p>

            <h2 className="mt-2 text-lg font-medium text-zinc-900">
              User details
            </h2>

            <p className="mt-1 text-xs text-zinc-500">
              Enter the account information for the new user.
            </p>

          </div>

          {/* =================================================
              FIELDS
          ================================================== */}

          <div className="grid gap-5 sm:grid-cols-2">

            {/* Name */}

            <div>
              <label
                htmlFor="name"
                className="
                  mb-2.5
                  block
                  text-sm
                  font-medium
                  text-zinc-600
                "
              >
                Name
              </label>

              <input
                id="name"
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="Full name"
                className="
                  w-full
                  rounded-xl
                  border border-zinc-200
                  bg-zinc-50
                  px-4
                  py-3.5
                  text-sm
                  text-zinc-900
                  outline-none
                  transition-all
                  duration-200
                  placeholder:text-zinc-400
                  hover:border-zinc-300
                  hover:bg-white
                  focus:border-zinc-400
                  focus:bg-white
                  focus:ring-2
                  focus:ring-zinc-900/5
                "
              />
            </div>

            {/* Email */}

            <div>
              <label
                htmlFor="email"
                className="
                  mb-2.5
                  block
                  text-sm
                  font-medium
                  text-zinc-600
                "
              >
                Email
              </label>

              <input
                id="email"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="user@example.com"
                className="
                  w-full
                  rounded-xl
                  border border-zinc-200
                  bg-zinc-50
                  px-4
                  py-3.5
                  text-sm
                  text-zinc-900
                  outline-none
                  transition-all
                  duration-200
                  placeholder:text-zinc-400
                  hover:border-zinc-300
                  hover:bg-white
                  focus:border-zinc-400
                  focus:bg-white
                  focus:ring-2
                  focus:ring-zinc-900/5
                "
              />
            </div>

            {/* Username */}

            <div>
              <label
                htmlFor="username"
                className="
                  mb-2.5
                  block
                  text-sm
                  font-medium
                  text-zinc-600
                "
              >
                Username
              </label>

              <input
                id="username"
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                required
                placeholder="username"
                className="
                  w-full
                  rounded-xl
                  border border-zinc-200
                  bg-zinc-50
                  px-4
                  py-3.5
                  text-sm
                  text-zinc-900
                  outline-none
                  transition-all
                  duration-200
                  placeholder:text-zinc-400
                  hover:border-zinc-300
                  hover:bg-white
                  focus:border-zinc-400
                  focus:bg-white
                  focus:ring-2
                  focus:ring-zinc-900/5
                "
              />
            </div>

            {/* Password */}

            <div>
              <label
                htmlFor="password"
                className="
                  mb-2.5
                  block
                  text-sm
                  font-medium
                  text-zinc-600
                "
              >
                Password
              </label>

              <input
                id="password"
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                minLength={6}
                placeholder="Minimum 6 characters"
                className="
                  w-full
                  rounded-xl
                  border border-zinc-200
                  bg-zinc-50
                  px-4
                  py-3.5
                  text-sm
                  text-zinc-900
                  outline-none
                  transition-all
                  duration-200
                  placeholder:text-zinc-400
                  hover:border-zinc-300
                  hover:bg-white
                  focus:border-zinc-400
                  focus:bg-white
                  focus:ring-2
                  focus:ring-zinc-900/5
                "
              />
            </div>

            {/* Role */}

            <div className="sm:col-span-2">

              <label
                className="
                  mb-2.5
                  block
                  text-sm
                  font-medium
                  text-zinc-600
                "
              >
                Role
              </label>

              <CustomSelect
                value={formData.role}
                onChange={(value) =>
                  handleChange({
                    target: {
                      name: "role",
                      value,
                    },
                  })
                }
                options={[
                  {
                    value: "client",
                    label: "Client",
                  },
                  {
                    value: "admin",
                    label: "Admin",
                  },
                ]}
              />

              <p className="mt-2 text-xs leading-5 text-zinc-400">
                Client is recommended unless administrator access
                is required.
              </p>
            </div>
          </div>

          {/* =================================================
              MESSAGES
          ================================================== */}

          {error && (
            <div
              className="
                mt-6
                rounded-xl
                border border-red-200
                bg-red-50
                px-4
                py-3
                text-sm
                text-red-600
              "
            >
              {error}
            </div>
          )}

          {success && (
            <div
              className="
                mt-6
                rounded-xl
                border border-emerald-200
                bg-emerald-50
                px-4
                py-3
                text-sm
                text-emerald-700
              "
            >
              {success}
            </div>
          )}

          {/* =================================================
              SUBMIT
          ================================================== */}

          <div
            className="
              mt-8
              flex
              flex-col-reverse
              gap-3
              border-t
              border-zinc-200
              pt-7
              sm:flex-row
              sm:items-center
              sm:justify-end
            "
          >
            <button
              type="button"
              onClick={() => navigate("/admin/users")}
              disabled={loading}
              className="
                inline-flex
                items-center
                justify-center
                rounded-xl
                border border-zinc-200
                bg-white
                px-5
                py-3
                text-sm
                font-medium
                text-zinc-600
                shadow-sm
                transition-all
                duration-200
                hover:border-zinc-300
                hover:bg-zinc-50
                hover:text-zinc-900
                disabled:cursor-not-allowed
                disabled:opacity-50
              "
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="
                group
                inline-flex
                items-center
                justify-center
                gap-2
                rounded-xl
                bg-zinc-900
                px-5
                py-3
                text-sm
                font-medium
                text-white
                shadow-[0_8px_25px_rgba(0,0,0,0.08)]
                transition-all
                duration-200
                hover:-translate-y-0.5
                hover:bg-zinc-800
                hover:shadow-[0_12px_35px_rgba(0,0,0,0.12)]
                active:translate-y-0
                disabled:cursor-not-allowed
                disabled:opacity-50
              "
            >
              <UserPlus
                size={17}
                className="
                  transition-transform
                  duration-200
                  group-hover:scale-105
                "
              />

              {loading ? "Creating..." : "Create User"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default AdminCreateUser;