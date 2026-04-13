export type Trip = {
  id: number;
  name: string;
  destination: string;
  country: string;
  coverImage: string | null;
  startDate: string;
  endDate: string;
};

export type TripFormData = {
  name: string;
  destination: string;
  country: string;
  coverImage: string | null;
  startDate: string;
  endDate: string;
};
