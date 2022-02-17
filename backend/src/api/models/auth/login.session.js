const mongoose = require("mongoose"),
   Schema = mongoose.Schema,
   config = require("@config/vars"),
   addMinutes = require("date-fns/add_minutes")
uuidv1 = require("uuid/v1")

const EntityTypes = ["USER","ADMIN"]
const sessionSchema = new Schema(
   {
      entity: { type: Schema.Types.ObjectId, required: true },
      entityType: { type: String, enum: EntityTypes },
      platformPartner: { type: Schema.Types.ObjectId, ref: "PlatformPartner" },
      name: { type: String },
      role: { type: String },
      agentType: { type: String },
      ipAddress: { type: String },
      token: { type: String, required: true },
      loginTime: { type: Date, default: new Date() },
      logoutTime: {
         type: Date,
         default: addMinutes(new Date(), config.userSessionTimeInMins)
      },
      isActive: { type: Boolean, default: true },
      channel: { type: String, enum: ["WEB", "MOBILE"], default: "WEB" }
   },
   {
      timestamps: true
   }
)

sessionSchema.statics = {
   async createSession(sessionData) {
      try {
         let session = new this(sessionData)
         const entity = sessionData.entity
         session.firstName = entity.firstName
         session.lastName = entity.lastName

         session.role = entity.role
         session.token = uuidv1()
         // session.platformPartner = entity.platformPartner ? entity.platformPartner : undefined
         session.logoutTime = addMinutes(new Date(), config.mobileUserTimeInMins || 43200)

         loginSession = await session.save()
         return { token: loginSession }
      } catch (error) {
         throw error
      }
   },
   closeSessions(userId, channel = "MOBILE", cb) {
      console.log(`closing open sessions for userId: ${userId}`)
      cb(null)
   }
}

module.exports = mongoose.model("LoginSession", sessionSchema)
