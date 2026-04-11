import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import { normalizeAuthIdentifier } from "@/lib/phone";

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        identifier: { label: "Email or Mobile", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        await dbConnect();

        const identifier = normalizeAuthIdentifier(credentials?.identifier);

        if (!identifier.raw || !credentials?.password) {
          throw new Error("Please enter your email or mobile number and password.");
        }

        if (identifier.type === "phone" && !identifier.phone) {
          throw new Error("Please enter a valid mobile number.");
        }

        const userQuery =
          identifier.type === "email"
            ? { email: identifier.email }
            : {
                $or: [
                  { phoneNormalized: identifier.phone },
                  { phone: identifier.raw.trim() },
                ],
              };

        const user = await User.findOne(userQuery);

        if (!user) {
          throw new Error("Invalid email, mobile number, or password.");
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
          throw new Error("Invalid email, mobile number, or password.");
        }

        await User.findByIdAndUpdate(user._id, { lastLogin: new Date() });

        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          image: user.image,
          role: user.role,
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
            name: user.name,
            email: user.email,
            image: user.image,
            role: "user",
            status: "active",
          });
        } else {
          if (existing.status === "banned" || existing.status === "suspended") {
            return false;
          }

          await User.findByIdAndUpdate(existing._id, {
            image: user.image,
            lastLogin: new Date(),
          });

          user.id = existing._id.toString();
          user.role = existing.role;
          user.status = existing.status;
        }
      }

      return true;
    },

    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.status = user.status;
      }

      if (trigger === "update" && token.id) {
        await dbConnect();
        const dbUser = await User.findById(token.id).select("role status").lean();

        if (dbUser) {
          token.role = dbUser.role;
          token.status = dbUser.status;
        }
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.status = token.status;
      }

      return session;
    },
  },

  pages: {
    signIn: "/login",
    error: "/login",
  },

  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },

  secret: process.env.NEXTAUTH_SECRET,
};
