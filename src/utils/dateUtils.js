export const getFirebaseTimestamp = (timestamp) => {
    return timestamp?.seconds + (timestamp?.nanoseconds / 1e9) || 0;
};

export const sortByTimestamp = (item, ascending = true) => {
    return [...item].sort((a,b) => {
        const aTime = getFirebaseTimestamp(a.timestamp || a.lastMessageTimestamp);
        const bTime = getFirebaseTimestamp(b.timestamp || b.lastMessageTimestamp);
        return ascending ? aTime - bTime : bTime - aTime;
    })
}