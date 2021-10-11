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
        is_connected: boolean;
        connected_at: string;
        disconnected_at: string;
      };
    };
    guest: {
      uid: string;
      email: string;
      display_name: string;
      photo_url: string;
      connection: {
        is_connected: boolean;
        connected_at: string;
        disconnected_at: string;
      };
    };
  };
}
