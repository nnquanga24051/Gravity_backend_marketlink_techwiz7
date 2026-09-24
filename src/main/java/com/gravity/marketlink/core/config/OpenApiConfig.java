package com.gravity.marketlink.core.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    private static final String SECURITY_SCHEME_NAME = "Bearer Authentication";

    @Bean
    public OpenAPI marketLinkOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("MarketLink API Documentation")
                        .description("Tài liệu đặc tả API và giao diện thử nghiệm tương tác cho hệ thống MarketLink (TechWiz 7).")
                        .version("1.0.0")
                        .contact(new Contact()
                                .name("Gravity Team - MarketLink")
                                .email("dev@marketlink.vn"))
                        .license(new License()
                                .name("Apache 2.0")
                                .url("https://springdoc.org")))
                .addSecurityItem(new SecurityRequirement().addList(SECURITY_SCHEME_NAME))
                .components(new Components()
                        .addSecuritySchemes(SECURITY_SCHEME_NAME, new SecurityScheme()
                                .name(SECURITY_SCHEME_NAME)
                                .type(SecurityScheme.Type.HTTP)
                                .scheme("bearer")
                                .bearerFormat("JWT")
                                .description("Nhập token JWT thu được từ API login (Không cần gõ chữ Bearer, Swagger sẽ tự thêm).")));
    }
}
