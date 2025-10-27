const eventBus = require("../utils/eventBus");
const Notification = require("../models/Notification");
const User = require("../models/User");
const Post = require("../models/Post");

function buildLikePreview(usernames){
    const total = usernames.length;
    if(total === 0)return '';
    if(total === 1)return `${usernames[0]} liked your post`
    if(total === 2)return `${usernames[0]} and ${usernames[1]} liked your post`
    const others = total - 2;
    return `${usernames[0]}, ${usernames[1]} and ${others} others liked your post`
}

// someone liked a post
eventBus.on("post.liked", async ({postId, actorId, postOwnerId}) => {
    try {
         console.log("Event received: post.liked", { postId, actorId, postOwnerId });
        if(String(actorId) === String(postOwnerId))return;

        const [actor, post] = await Promise.all([
            User.findById(actorId).select("username avatarUrl").lean(),
            Post.findById(postId).select("caption").lean()
        ])
        if(!actor)return;

        let notification = await Notification.findOne({
            user: postOwnerId,
            type: "LIKE",
            refType: "Post",
            refId: postId
        })

        if(!notification){
            // first like
            const usernames = [actor.username];
            await Notification.create({
                user: postOwnerId,
                actor: actorId,
                type: "LIKE",
                refType: "Post",
                refId: postId,
                actors: [actorId],
                data: {
                    preview: buildLikePreview(usernames),
                    actorAvatar: [actor.avatarUrl || null],
                    caption: post?.caption ? post.caption.length > 10 ? post.caption.slice(0,20) + "..." : post.caption : "",
                },
                actionUrl: `/post/${postId}`
            })

            return;
        }

        const alreadyLiked = notification.actors.some(a => String(a) === String(actorId));
        if(alreadyLiked)return;

        // push at start of an array this way(bwlow)
        notification.actors.unshift(actorId);

        const firstTwo = notification.actors.slice(0,2);
        const firstTwoLikersDocs = await User.find({_id : {$in: firstTwo}}).select("username avatarUrl").lean();
        const usernames = firstTwoLikersDocs.map(liker => liker.username);

        notification.data = {
            preview: buildLikePreview(usernames),
            actorAvatar: firstTwoLikersDocs.map(liker => liker.avatarUrl || null),
            caption: post?.caption ? post.caption.length > 10 ? post.caption.slice(0,20) + "..." : post.caption : "",
        }

        notification.actor = actorId;
        await notification.save();

        console.log(`Notification created for liking the post: ${postId}`);

    } catch (error) {
        console.error("Notification Listener error: ",error);
    }
})

eventBus.on("post.unliked", async({postId, actorId, postOwnerId}) => {
    try {
        
        const notification = await Notification.findOne({
            user: postOwnerId,
            type: "LIKE",
            refType: "Post",
            refId: postId
        })
        if(!notification)return;

        notification.actors = notification.actors.filter(actor => String(actor) !== String(actorId));

        if(notification.actors.length === 0){
            await Notification.deleteOne({_id : notification._id});
            return;
        }

        const post = await Post.findById(postId).select("caption").lean();
        if(!post)return;

        const firstTwo = notification.actors.slice(0,2);
        const firstTwoLikersDocs = await User.find({_id : {$in: firstTwo}}).select("username avatarUrl").lean();
        const usernames = firstTwoLikersDocs.map(liker => liker.username);

        notification.data = {
            preview: buildLikePreview(usernames),
            actorAvatar: firstTwoLikersDocs.map(liker => liker.avatarUrl || null),
            caption: post?.caption ? post.caption.length > 10 ? post.caption.slice(0,20) + "..." : post.caption : "",
        }

        notification.actor = notification.actors[0] || null;
        await notification.save();

    } catch (error) {
        console.error("Notification Listner error (Post.unliked: ", error);
    }
})