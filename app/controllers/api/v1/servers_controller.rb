require "faraday"
require "base64"

module Api
  module V1
    class ServersController < ApplicationController
      def index
        url = "https://global.xirsys.net/_turn/MyFirstApp/"
        user = Rails.application.credentials.xirsys[:id]
        secret_key = Rails.application.credentials.xirsys[:secret_key]
        auth = "Basic " + Base64.encode64("#{user}:#{secret_key}").gsub!("\n", "")
        headers = { "Authorization" => auth, "Content-Type" => nil }

        res = Faraday.put(url, {}, headers)
        
        puts res.body
        render json: res.body, status: 200
      end
    end
  end
end
