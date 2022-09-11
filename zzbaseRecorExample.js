const user = {
  username: "asdasd",
  mail: "asdasd@gmail.com",
  settings: "some settings",
  playlists: {
    playlistLevelTop: {
      playlistName: "Some name for this playlist!",
      playlistDescription: "Some description for!",
      playlistLevel1: {
        playlistName: "Some name for inner playlist!",
        playlistDescription: "Some description for INNER!",
      },
      videosLevel1: {
        uniqueVId1: {
          videoType: "youtube-video",
          videoName: "Some header from link",
          fullLink: "youtube.com/videoID1",
          splashImageLink: "blob:youtube.com/image1",
          description: "Some description of this video!",
        },
      },
    },
    videosLevelTop: {
      uniqueVId1: {
        videoType: "youtube-video",
        videoName: "Some header from link",
        fullLink: "youtube.com/videoID1",
        splashImageLink: "blob:youtube.com/image1",
        description: "Some description of this video!",
      },
      uniqueVId2: {
        videoType: "udemy-video",
        videoName: "Some header from link",
        fullLink: "udemy.com/videoID2",
        splashImageLink: "blob:udemy.com/image2",
        description: "Some description of this video!",
      },
    },
  },
  bookmarks: {
    uniqueV1: [
      { time: 250, desc: "this is the description of this bookmark" },
      { time: 650, desc: "Another description1" },
      { time: 200, desc: "Another description2" },
      { time: 140, desc: "Another description3" },
    ],
    uniqueV2: [
      { time: 250, desc: "this is the description of this bookmark" },
      { time: 650, desc: "Another description1" },
      { time: 200, desc: "Another description2" },
      { time: 140, desc: "Another description3" },
    ],
    uniqueV3: [
      { time: 250, desc: "this is the description of this bookmark" },
      { time: 650, desc: "Another description1" },
      { time: 200, desc: "Another description2" },
      { time: 140, desc: "Another description3" },
    ],
  },
};
