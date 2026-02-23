"use server";

import { createClient } from "@/utils/supabase/server";

export interface ActivityFeedItem {
    id: string;
    type: string;
    user: {
        name: string;
        avatar: string | null;
    };
    content: string;
    subtext: string | null;
    metadata: any;
    time: string;
    likes: number;
    isLikedByMe: boolean;
}

export async function getGlobalActivityFeed(limit = 10): Promise<ActivityFeedItem[]> {
    const supabase = await createClient();

    // 1. Get the current user to check likes
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id;

    // 2. Fetch the feed from Supabase
    // We join with public.profiles to get the user's name
    // We join with activity_likes to count likes and check if the current user liked it
    const { data: feedData, error } = await supabase
        .from('activity_feed')
        .select(`
            id,
            activity_type,
            content,
            subtext,
            metadata,
            created_at,
            profiles:user_id ( full_name, username, avatar_url ),
            likes:activity_likes ( user_id )
        `)
        .order('created_at', { ascending: false })
        .limit(limit);

    if (error) {
        console.error("Error fetching activity feed:", error);
        return [];
    }

    if (!feedData || feedData.length === 0) {
        return [];
    }

    // 3. Transform the data for the frontend
    const formattedFeed: ActivityFeedItem[] = feedData.map((item: any) => {

        // Count likes and check if current user liked it
        const likesList = item.likes || [];
        const likesCount = likesList.length;
        const isLikedByMe = userId ? likesList.some((like: any) => like.user_id === userId) : false;

        // Extract user data from profiles
        const userData = item.profiles || {};
        const userName = userData.full_name || userData.username || "Usuario";

        // Format time relative to now (e.g. "Hace 10 min")
        const date = new Date(item.created_at);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        let timeStr = "";
        if (diffMins < 1) timeStr = "Hace un momento";
        else if (diffMins < 60) timeStr = `Hace ${diffMins} min`;
        else if (diffHours < 24) timeStr = `Hace ${diffHours} h`;
        else if (diffDays === 1) timeStr = "Ayer";
        else timeStr = `Hace ${diffDays} días`;

        return {
            id: item.id,
            type: item.activity_type,
            user: {
                name: userName,
                avatar: userData.avatar_url || null,
            },
            content: item.content,
            subtext: item.subtext,
            metadata: item.metadata,
            time: timeStr,
            likes: likesCount,
            isLikedByMe: isLikedByMe,
        };
    });

    return formattedFeed;
}

export async function toggleActivityLike(activityId: string): Promise<{ success: boolean; isLiked: boolean; error?: string }> {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        return { success: false, isLiked: false, error: "Unauthorized" };
    }

    // Check if like exists
    const { data: existingLike } = await supabase
        .from('activity_likes')
        .select('*')
        .eq('activity_id', activityId)
        .eq('user_id', user.id)
        .single();

    if (existingLike) {
        // Unlike
        const { error: deleteError } = await supabase
            .from('activity_likes')
            .delete()
            .eq('activity_id', activityId)
            .eq('user_id', user.id);

        if (deleteError) {
            console.error("Error deleting like:", deleteError);
            return { success: false, isLiked: true, error: deleteError.message };
        }

        return { success: true, isLiked: false };
    } else {
        // Like
        const { error: insertError } = await supabase
            .from('activity_likes')
            .insert({
                activity_id: activityId,
                user_id: user.id
            });

        if (insertError) {
            console.error("Error inserting like:", insertError);
            return { success: false, isLiked: false, error: insertError.message };
        }

        return { success: true, isLiked: true };
    }
}
