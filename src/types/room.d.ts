declare interface Room {
  id: string;
  created_at: string;
  expires_at: string;
  members: {
    host: {
      uid: string;
      email: string;
      display_name: string;
      photo_url: string;
      connection: {
        status: 'disconnected' | 'ready' | 'connecting';
        connected_at: string;
        disconnected_at: string;
      };
      password: {
        value: string;
        salt: string;
      };
    };
    guest: {
      uid: string;
      email: string;
      display_name: string;
      photo_url: string;
      connection: {
        status: 'disconnected' | 'ready' | 'connecting';
        connected_at: string;
        disconnected_at: string;
      };
      password: {
        value: string;
        salt: string;
      };
    };
  };
}
