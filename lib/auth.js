import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import bcrypt from "bcryptjs";

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email:    { label: "Email",    type: "email"    },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        await dbConnect();

        const user = await User.findOne({ email: credentials.email?.toLowerCase() });

        // Allow login even if user signed up via Google — password may have been added later
        if (!user) {
          throw new Error("Invalid email or password.");
        }
        if (!user.password) {
          throw new Error("This account uses Google sign-in. Please continue with Google.");
        }

        if (user.status === "banned") {
          throw new Error("Your account has been banned. Contact support.");
        }
        if (user.status === "suspended") {
          throw new Error("Your account has been suspended. Contact support.");
        }

        const isPasswordCorrect = await bcrypt.compare(credentials.password, user.password);
        if (!isPasswordCorrect) {
          throw new Error("Invalid email or password.");
        }

        // Update last login timestamp
        await User.findByIdAndUpdate(user._id, { lastLogin: new Date() });

        return {
          id:     user._id.toString(),
          name:   user.name,
          email:  user.email,
          image:  user.image,
          role:   user.role,
          status: user.status,
        };
      },
    }),
  ],

  callbacks: {
    async signIn({ user, account }) {
      if (account.provider === "google") {
        await dbConnect();
        const existing = await User.findOne({ email: user.email });

        if (!existing) {
          await User.create({
            name:   user.name,
            email:  user.email,
            image:  user.image,
            role:   "user",
            status: "active",
          });
        } else {
          if (existing.status === "banned" || existing.status === "suspended") {
            return false; // block login
          }
          await User.findByIdAndUpdate(existing._id, {
            image:     user.image,
            lastLogin: new Date(),
          });
          // Inject role/status so jwt callback gets them from Google path too
          user.id     = existing._id.toString();
          user.role   = existing.role;
          user.status = existing.status;
        }
      }
      return true;
    },

    async jwt({ token, user, trigger }) {
      if (user) {
        token.id     = user.id;
        token.role   = user.role;
        token.status = user.status;
      }
      // Re-fetch role/status when session.update() is called (e.g. after role change)
      if (trigger === "update" && token.id) {
        await dbConnect();
        const dbUser = await User.findById(token.id).select("role status").lean();
        if (dbUser) {
          token.role   = dbUser.role;
          token.status = dbUser.status;
        }
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id     = token.id;
        session.user.role   = token.role;
        session.user.status = token.status;
      }
      return session;
    },
  },

  pages: {
    signIn: "/login",
    error:  "/login",
  },

  session: {
    strategy: "jwt",
    maxAge:   30 * 24 * 60 * 60, // 30 days
  },

  secret: process.env.NEXTAUTH_SECRET,
};
