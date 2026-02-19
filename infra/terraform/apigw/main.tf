resource "aws_apigatewayv2_api" "http_api" {
  name          = "meetmind-api"
  protocol_type = "HTTP"
}

resource "aws_apigatewayv2_integration" "upload_integration" {
  api_id                 = aws_apigatewayv2_api.http_api.id
  integration_type       = "AWS_PROXY"
  integration_uri        = var.upload_lambda_invoke_arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "upload_route" {
  api_id    = aws_apigatewayv2_api.http_api.id
  route_key = "POST /upload"
  target    = "integrations/${aws_apigatewayv2_integration.upload_integration.id}"
}

resource "aws_lambda_permission" "upload_permission" {
  statement_id  = "AllowAPIGatewayInvokeUpload"
  action        = "lambda:InvokeFunction"
  function_name = var.upload_lambda_arn
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.http_api.execution_arn}/*/*"
}

resource "aws_apigatewayv2_integration" "fetch_integration" {
  api_id                 = aws_apigatewayv2_api.http_api.id
  integration_type       = "AWS_PROXY"
  integration_uri        = var.fetch_lambda_invoke_arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "fetch_route" {
  api_id    = aws_apigatewayv2_api.http_api.id
  route_key = "GET /meeting/{meetingId}"
  target    = "integrations/${aws_apigatewayv2_integration.fetch_integration.id}"
}

resource "aws_lambda_permission" "fetch_permission" {
  statement_id  = "AllowAPIGatewayInvokeFetch"
  action        = "lambda:InvokeFunction"
  function_name = var.fetch_lambda_arn
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.http_api.execution_arn}/*/*"
}

resource "aws_apigatewayv2_stage" "default" {
  api_id      = aws_apigatewayv2_api.http_api.id
  name        = "$default"
  auto_deploy = true
}
