const playlistsAndBookmarks = {
  username: "asdasd",

  playlists: [
    {
      level1PlaylistName: "Programming",
      lowerLevelPlaylists: [
        {
          level2PlaylistName: "Javascript",
          level2Videos: [
            {
              videoId: "asd4fwetw",
              title: "Some video title111!",
              desc: "Some description here1111",
              splashImageURL: "youtube.com/asdasdd",
            },
            {
              videoId: "sertGtAW",
              title: "Some video title222!",
              desc: "Some description here2222",
            },
          ],
        },
        {
          level2PlaylistName: "HTML+CSS",
          level2Videos: [],
        },
      ],
      level1Videos: [
        {
          videoId: "ASdtTSDt4",
          title: "Some video title333!",
          desc: "Some description here3333",
        },
      ],
    },
    {
      level1PlaylistName: "Guitar playing",
      lowerLevelPlaylists: [],
      level1Videos: [],
    },
  ],

  bookmarks: {
    asd4fwetw: [
      { time: 250, desc: "this is the description of this bookmark" },
      { time: 650, desc: "Another description1" },
      { time: 200, desc: "Another description2" },
      { time: 140, desc: "Another description3" },
    ],
    sertGtAW: [
      { time: 250, desc: "this is the description of this bookmark" },
      { time: 650, desc: "Another description1" },
      { time: 200, desc: "Another description2" },
      { time: 140, desc: "Another description3" },
    ],
    ASdtTSDt4: [
      { time: 250, desc: "this is the description of this bookmark" },
      { time: 650, desc: "Another description1" },
      { time: 200, desc: "Another description2" },
      { time: 140, desc: "Another description3" },
    ],
  },
};
