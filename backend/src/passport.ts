import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { UserModel } from "./db";

export function configurePassport(): typeof passport {
  const googleClientId = process.env.GOOGLE_CLIENT_ID;
  const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const googleCallbackUrl =
    process.env.GOOGLE_CALLBACK_URL || "http://localhost:5000/api/v1/auth/google/callback";

  if (googleClientId && googleClientSecret) {
    passport.use(
      new GoogleStrategy(
        {
          clientID: googleClientId,
          clientSecret: googleClientSecret,
          callbackURL: googleCallbackUrl,
        },
        async (_accessToken, _refreshToken, profile, done) => {
          try {
            const email = profile.emails?.[0]?.value?.toLowerCase();
            if (!email) {
              return done(new Error("No email found in Google account profile"));
            }

            // 1. Check if user already linked via Google ID
            let user = await UserModel.findOne({ googleId: profile.id }).lean();
            if (user) {
              return done(null, user);
            }

            // 2. Check if user exists with the same email
            user = await UserModel.findOne({ email }).lean();
            if (user) {
              // Link Google account
              await UserModel.findByIdAndUpdate(user._id, {
                googleId: profile.id,
                avatar: profile.photos?.[0]?.value || user.avatar,
                provider: "google",
              });
              const updated = await UserModel.findById(user._id).lean();
              return done(null, updated || user);
            }

            // 3. Create a new user from Google profile
            const rawName = profile.displayName || profile.name?.givenName || "Creator";
            const baseUsername = rawName
              .toLowerCase()
              .replace(/[^a-z0-9_]/g, "")
              .slice(0, 14) || "sketcher";
            const suffix = Math.random().toString(36).substring(2, 6);
            const username = `${baseUsername}_${suffix}`;

            const newUser = await UserModel.create({
              username,
              email,
              name: rawName,
              googleId: profile.id,
              avatar: profile.photos?.[0]?.value,
              provider: "google",
            });

            return done(null, newUser.toObject());
          } catch (err) {
            console.error("Passport Google OAuth error:", err);
            return done(err as Error);
          }
        }
      )
    );
  } else {
    console.log(
      "⚠️ Passport Google Strategy disabled: GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET not set in environment."
    );
  }

  return passport;
}

export default passport;
