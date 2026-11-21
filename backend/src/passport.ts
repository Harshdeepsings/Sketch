import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { UserModel } from "./db";

export function configurePassport(): typeof passport {
  // 1. Save user ID in session
  passport.serializeUser((user: any, done) => {
    done(null, user._id.toString());
  });

  // 2. Fetch user from database using session ID
  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await UserModel.findById(id).select("-password").lean();
      done(null, user || null);
    } catch (err) {
      done(err, null);
    }
  });

  // 3. Google OAuth Strategy (if credentials are provided)
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

            // Check if user already exists by Google ID
            let user = await UserModel.findOne({ googleId: profile.id }).lean();
            if (user) {
              return done(null, user);
            }

            // Check if user already exists by Email
            user = await UserModel.findOne({ email }).lean();
            if (user) {
              await UserModel.findByIdAndUpdate(user._id, {
                googleId: profile.id,
                avatar: profile.photos?.[0]?.value || user.avatar,
                provider: "google",
              });
              const updated = await UserModel.findById(user._id).lean();
              return done(null, updated || user);
            }

            // Create new user for first-time Google sign in
            const rawName = profile.displayName || profile.name?.givenName || "Sketchher";
            const baseUsername =
              rawName
                .toLowerCase()
                .replace(/[^a-z0-9_]/g, "")
                .slice(0, 14) || "sketchher";
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
            console.error("Google OAuth error:", err);
            return done(err as Error);
          }
        }
      )
    );
  } else {
    console.log("Passport: Google OAuth disabled (missing credentials in .env)");
  }

  return passport;
}

export default passport;
