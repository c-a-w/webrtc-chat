Rails.application.routes.draw do
  root to: "calls#root"
  resources :calls, only: :create
  mount ActionCable.server, at: "/cable"
  namespace :api do
    namespace :v1 do
      get "servers", to: "servers#index"
    end
  end
end
