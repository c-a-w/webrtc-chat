require "faraday"
require "base64"
require 'twilio-ruby'

module Api
  module V1
    class ServersController < ApplicationController
      def index_xirsys
        url = "https://global.xirsys.net/_turn/MyFirstApp/"
        user = Rails.application.credentials.xirsys[:id]
        secret_key = Rails.application.credentials.xirsys[:secret_key]
        auth = "Basic " + Base64.encode64("#{user}:#{secret_key}").gsub!("\n", "")
        headers = { "Authorization" => auth, "Content-Type" => nil }

        res = Faraday.put(url, {}, headers)

        render json: res.body, status: 200
      end

      def index_twilio
        account_sid = Rails.application.credentials.twilio[:account_sid]
        auth_token = Rails.application.credentials.twilio[:auth_token]
        client = Twilio::REST::Client.new(account_sid, auth_token)
        token = client.tokens.create(ttl: 3600)
        puts token.ice_servers
        render json: token.ice_servers, status: 200
      end
    end
  end
end
