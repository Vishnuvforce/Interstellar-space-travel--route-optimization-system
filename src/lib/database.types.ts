export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string;
          avatar_url: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          username?: string;
          avatar_url?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          username?: string;
          avatar_url?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      galaxies: {
        Row: {
          id: string;
          name: string;
          type: string;
          position_x: number;
          position_y: number;
          position_z: number;
          color: string;
          core_color: string;
          arm_color: string;
          description: string;
          distance: string;
          star_count: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          name: string;
          type: string;
          position_x?: number;
          position_y?: number;
          position_z?: number;
          color?: string;
          core_color?: string;
          arm_color?: string;
          description?: string;
          distance?: string;
          star_count?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          type?: string;
          position_x?: number;
          position_y?: number;
          position_z?: number;
          color?: string;
          core_color?: string;
          arm_color?: string;
          description?: string;
          distance?: string;
          star_count?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      star_systems: {
        Row: {
          id: string;
          galaxy_id: string;
          name: string;
          star_type: string;
          star_color: string;
          star_radius: number;
          position_x: number;
          position_y: number;
          position_z: number;
          description: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          galaxy_id: string;
          name: string;
          star_type: string;
          star_color?: string;
          star_radius?: number;
          position_x?: number;
          position_y?: number;
          position_z?: number;
          description?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          galaxy_id?: string;
          name?: string;
          star_type?: string;
          star_color?: string;
          star_radius?: number;
          position_x?: number;
          position_y?: number;
          position_z?: number;
          description?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      planets: {
        Row: {
          id: string;
          system_id: string;
          name: string;
          type: string;
          radius: number;
          orbit_radius: number;
          orbit_speed: number;
          rotation_speed: number;
          color: string;
          atmosphere_color: string;
          atmosphere_intensity: number;
          description: string;
          temperature: string;
          mass: string;
          discovered: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          system_id: string;
          name: string;
          type: string;
          radius?: number;
          orbit_radius?: number;
          orbit_speed?: number;
          rotation_speed?: number;
          color?: string;
          atmosphere_color?: string;
          atmosphere_intensity?: number;
          description?: string;
          temperature?: string;
          mass?: string;
          discovered?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          system_id?: string;
          name?: string;
          type?: string;
          radius?: number;
          orbit_radius?: number;
          orbit_speed?: number;
          rotation_speed?: number;
          color?: string;
          atmosphere_color?: string;
          atmosphere_intensity?: number;
          description?: string;
          temperature?: string;
          mass?: string;
          discovered?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      moons: {
        Row: {
          id: string;
          planet_id: string;
          name: string;
          radius: number;
          orbit_radius: number;
          orbit_speed: number;
          color: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          planet_id: string;
          name: string;
          radius?: number;
          orbit_radius?: number;
          orbit_speed?: number;
          color?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          planet_id?: string;
          name?: string;
          radius?: number;
          orbit_radius?: number;
          orbit_speed?: number;
          color?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      user_bookmarks: {
        Row: {
          id: string;
          user_id: string;
          item_type: string;
          item_id: string;
          notes: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          item_type: string;
          item_id: string;
          notes?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          item_type?: string;
          item_id?: string;
          notes?: string;
          created_at?: string;
        };
      };
      user_sessions: {
        Row: {
          id: string;
          user_id: string;
          current_level: string;
          current_galaxy_id: string | null;
          current_system_id: string | null;
          current_planet_id: string | null;
          camera_position_x: number | null;
          camera_position_y: number | null;
          camera_position_z: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          current_level?: string;
          current_galaxy_id?: string | null;
          current_system_id?: string | null;
          current_planet_id?: string | null;
          camera_position_x?: number | null;
          camera_position_y?: number | null;
          camera_position_z?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          current_level?: string;
          current_galaxy_id?: string | null;
          current_system_id?: string | null;
          current_planet_id?: string | null;
          camera_position_x?: number | null;
          camera_position_y?: number | null;
          camera_position_z?: number | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
}
