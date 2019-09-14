Rails.application.routes.draw do
  root to: "calls#root"
  resources :calls, only: :create
  mount ActionCable.server, at: "/cable"
  namespace :api do
    namespace :v1 do
      get "servers/xirsys", to: "servers#index_xirsys"
      get "servers/twilio", to: "servers#index_twilio"
    end
  end
end
