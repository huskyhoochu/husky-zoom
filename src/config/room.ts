export const initRoom: Room = {
  id: '',
  created_at: '',
  expires_at: '',
  members: {
    host: {
      password: {
        value: '',
        salt: '',
      },
      uid: '',
      email: '',
      display_name: '',
      photo_url: '',
      connection: {
        status: 'disconnected',
        connected_at: '',
        disconnected_at: '',
      },
    },
    guest: {
      password: {
        value: '',
        salt: '',
      },
      uid: '',
      email: '',
      display_name: '',
      photo_url: '',
      connection: {
        status: 'disconnected',
        connected_at: '',
        disconnected_at: '',
      },
    },
  },
};
